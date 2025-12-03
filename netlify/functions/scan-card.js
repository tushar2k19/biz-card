import Tesseract from 'tesseract.js';

const FALLBACK_NOTICE = 'Anthropic API unavailable. Used local OCR fallback.';
const STRUCTURED_RESPONSE_PROMPT = `Extract all information from this business card and return it as a JSON object with these exact fields (use null if information is not found):
{
  "name": "full name",
  "title": "job title/designation",
  "company": "company name",
  "email": "email address",
  "phone": "phone number",
  "mobile": "mobile number if different",
  "website": "website URL",
  "address": "full address",
  "city": "city",
  "state": "state",
  "zipcode": "zip/postal code",
  "country": "country"
}

Return ONLY the JSON object, no other text.`;

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' })
      };
    }

    const { image, mimeType } = JSON.parse(event.body);

    if (!image || !mimeType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Image data and mimeType are required' })
      };
    }

    const anthropicResult = await tryAnthropic(image, mimeType);
    if (anthropicResult.success) {
      return respondOk(anthropicResult.data);
    }

    console.warn('Falling back to local OCR:', anthropicResult.reason);
    const fallbackData = await runLocalFallback(image);
    return respondOk(fallbackData, anthropicResult.reason);
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process image',
        message: error.message
      })
    };
  }
}

async function tryAnthropic(image, mimeType) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, reason: 'missing_api_key' };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: image
                }
              },
              {
                type: 'text',
                text: STRUCTURED_RESPONSE_PROMPT
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API Error:', response.status, errorText);
      return {
        success: false,
        reason: mapAnthropicError(response.status, errorText),
        status: response.status
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Anthropic request failed:', error);
    return { success: false, reason: 'anthropic_request_failed', error };
  }
}

function mapAnthropicError(status, message) {
  if (status === 400 && /credit balance is too low/i.test(message)) {
    return 'anthropic_insufficient_credit';
  }
  if (status === 401) {
    return 'anthropic_unauthorized';
  }
  if (status === 403) {
    return 'anthropic_forbidden';
  }
  return 'anthropic_error';
}

async function runLocalFallback(image) {
  const buffer = Buffer.from(image, 'base64');
  const { data } = await Tesseract.recognize(buffer, 'eng', {
    logger: m => {
      if (m.status === 'recognizing text') {
        console.log(`Tesseract progress: ${(m.progress * 100).toFixed(0)}%`);
      }
    }
  });

  const structured = structureCardData(data.text);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(structured, null, 2)
      }
    ],
    metadata: {
      source: 'tesseract',
      rawTextSample: data.text.slice(0, 200)
    }
  };
}

function structureCardData(text) {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const result = {
    name: lines[0] || null,
    title: lines[1] || null,
    company: null,
    email: matchFirst(text, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i),
    phone: null,
    mobile: null,
    website: normalizeWebsite(matchFirst(text, /(https?:\/\/[^\s]+|www\.[^\s]+)/i)),
    address: null,
    city: null,
    state: null,
    zipcode: null,
    country: null,
    source: 'fallback',
    fallbackNotice: FALLBACK_NOTICE
  };

  const companyCandidate = lines.find((line, idx) => idx > 1 && !line.match(/(tel|phone|mobile|email|www|http)/i));
  result.company = companyCandidate || null;

  const phoneMatches = Array.from(
    new Set(
      (text.match(/(\+?\d[\d\s().-]{7,}\d)/g) || []).map(num =>
        num.replace(/\s+/g, ' ').trim()
      )
    )
  );
  result.phone = phoneMatches[0] || null;
  result.mobile = phoneMatches[1] || null;

  const addressLines = lines.filter(line =>
    /(street|st\.|road|rd\.|ave|avenue|suite|ste\.|floor|blvd|ln|lane|drive|dr\.|parkway|pkwy|city|state|zip|country)/i.test(
      line
    )
  );
  if (addressLines.length) {
    const addressString = addressLines.join(', ');
    result.address = addressString;

    const cityStateZipMatch = addressString.match(/([A-Za-z\s]+),?\s+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)/);
    if (cityStateZipMatch) {
      result.city = cityStateZipMatch[1].trim();
      result.state = cityStateZipMatch[2].trim();
      result.zipcode = cityStateZipMatch[3].trim();
    }
  }

  const countryMatch = lines.find(line =>
    /(united states|usa|india|canada|australia|uk|united kingdom)/i.test(line)
  );
  result.country = countryMatch || null;

  return result;
}

function matchFirst(text, regex) {
  const match = text.match(regex);
  return match ? match[0] : null;
}

function normalizeWebsite(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `https://${url}`;
}

function respondOk(data, fallbackReason) {
  const body = fallbackReason
    ? {
      ...data,
      fallbackReason
    }
    : data;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
}
