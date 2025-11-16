# Business Card Scanner

An AI-powered business card scanner application that uses OCR (Optical Character Recognition) to extract contact information from business card images. Built with React, Vite, and Netlify Functions, featuring automatic image compression, intelligent data extraction, and local storage with export capabilities.

## 🚀 Features

- **AI-Powered OCR**: Uses Anthropic Claude API for accurate text extraction from business card images

- **Image Compression**: Automatically compresses images to under 3MB before processing
- **Multiple Upload Methods**: Upload from gallery or capture directly from camera
- **Local Storage**: All cards are stored locally in your browser
- **Export Options**: Export your contacts as CSV or JSON
- **Search & Filter**: Quickly find cards by name, company, email, or title
- **Edit & Delete**: Full CRUD operations for managing your business cards
- **Modern UI**: Beautiful dark-themed interface with smooth animations

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Netlify CLI** (for local development and deployment) - [Installation Guide](https://docs.netlify.com/cli/get-started/)
- **Anthropic API Key** - [Get your API key](https://console.anthropic.com/)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <https://github.com/tushar2k19/biz-card.git>
   cd business-card
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   For local development, create a `.env` file in the root directory:
   ```bash
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

   **Note**: For Netlify deployment, you'll need to set this as an environment variable in your Netlify dashboard (see Deployment section).

## 🔑 API Key Setup

### Getting an Anthropic API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your environment variables

### Setting Environment Variables

#### Local Development

Create a `.env` file in the project root:
```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important**: Add `.env` to your `.gitignore` file to prevent committing your API key.

#### Netlify Deployment

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add variable**
4. Set:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: Your API key
5. Click **Save**

## 🏃 Running Locally

### Development Mode (Full Stack)

To run both the frontend and Netlify functions locally:

```bash
netlify dev
```

This will:
- Start the Vite development server
- Start Netlify Functions locally
- Make the `/api/scan-card` endpoint available
- Open the app at `http://localhost:8888`

### Frontend Only (Vite)

To run only the frontend (without Netlify functions):

```bash
npm run dev
```

This starts Vite dev server at `http://localhost:5173` (default Vite port).

**Note**: OCR functionality will not work in this mode as it requires the Netlify function.

### Production Build

Build the project for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📁 Project Structure

```
business-card/
├── src/
│   ├── App.jsx                 # Main application component
│   ├── main.jsx                # React entry point
│   ├── index.css               # Global styles
│   └── utils/
│       └── imageCompression.js  # Image compression utility
├── netlify/
│   └── functions/
│       └── scan-card.js        # Netlify serverless function for OCR
├── dist/                       # Production build output
├── index.html                  # HTML template
├── netlify.toml                # Netlify configuration
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## 🚢 Deployment

### Deploy to Netlify

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize Netlify** (if not already initialized):
   ```bash
   netlify init
   ```

4. **Set environment variable in Netlify**:
   - Go to your Netlify site dashboard
   - Navigate to **Site settings** → **Environment variables**
   - Add `ANTHROPIC_API_KEY` with your API key value

5. **Deploy to production**:
   ```bash
   netlify deploy --prod
   ```

   Or deploy a preview:
   ```bash
   netlify deploy
   ```

### Alternative: Deploy via Git

1. Connect your GitHub/GitLab repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add `ANTHROPIC_API_KEY` environment variable in Netlify dashboard
5. Netlify will automatically deploy on every push to your main branch

## 🔧 Configuration

### Netlify Configuration (`netlify.toml`)

The project includes a `netlify.toml` file that configures:
- Build command and output directory
- Function directory
- API route redirects

### Vite Configuration

The Vite config (`vite.config.js`) sets up:
- React plugin
- Build output directory

## 📦 Dependencies

### Production Dependencies
- `react` ^18.2.0 - React library
- `react-dom` ^18.2.0 - React DOM rendering
- `tesseract.js` ^6.0.1 - OCR fallback library
- `lucide-react` ^0.263.1 - Icon library

### Development Dependencies
- `vite` ^5.0.0 - Build tool and dev server
- `@vitejs/plugin-react` ^4.2.1 - React plugin for Vite
- `tailwindcss` ^3.4.0 - Utility-first CSS framework
- `autoprefixer` ^10.4.16 - CSS post-processor
- `postcss` ^8.4.32 - CSS transformer

## 🎯 Usage

1. **Upload a Business Card**:
   - Click "Take Photo" to capture with your camera
   - Or click "From Gallery" to upload an existing image

2. **Automatic Processing**:
   - Image is automatically compressed if needed
   - OCR extracts contact information
   - Card is saved to local storage

3. **Manage Cards**:
   - Click on a card to view details
   - Use the edit button to modify information
   - Use the delete button to remove cards
   - Use the search bar to find specific cards

4. **Export Data**:
   - Click "Export CSV" to download contacts as CSV
   - Use browser DevTools to access localStorage for JSON export

## 🐛 Troubleshooting

### OCR Not Working

- **Check API Key**: Ensure `ANTHROPIC_API_KEY` is set correctly
- **Check API Credits**: Verify you have sufficient credits in your Anthropic account
- **Check Network**: Ensure you can reach the Anthropic API
- **Check Logs**: Use `netlify dev` and check the terminal for error messages

### Image Upload Issues

- **File Size**: Images are automatically compressed, but very large images may take time
- **File Format**: Supported formats: JPEG, PNG, WebP, GIF
- **Browser Compatibility**: Ensure your browser supports FileReader API

### Local Development Issues

- **Port Conflicts**: If port 8888 is in use, Netlify will suggest an alternative
- **Function Errors**: Check the terminal output when running `netlify dev`
- **Build Errors**: Run `npm run build` to check for compilation errors

### Netlify Deployment Issues

- **Environment Variables**: Ensure `ANTHROPIC_API_KEY` is set in Netlify dashboard
- **Build Failures**: Check Netlify build logs for errors
- **Function Timeout**: Netlify functions have a 10-second timeout limit

## 🔒 Security Notes

- **Never commit API keys**: Always use environment variables
- **Add `.env` to `.gitignore`**: Prevent accidental commits of sensitive data
- **Use Netlify Environment Variables**: For production deployments
- **API Key Rotation**: Regularly rotate your API keys for security

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check the [TODO.md](./TODO.md) for known issues and planned features

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude API
- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR fallback
- [Netlify](https://www.netlify.com/) for serverless functions hosting

---

**Note**: This project uses localStorage for data persistence. Data is stored locally in your browser and will be cleared if you clear browser data or use incognito mode. Consider implementing cloud storage for production use.

