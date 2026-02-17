import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Trash2, Download, Edit2, Save, X, Search, Grid, List, Mail, Phone, MapPin, Globe, Briefcase, User, Building2, Plus, Users } from 'lucide-react';
import { ensureImageUnderLimit } from '../utils/imageCompression';
import api, { getBackendBaseUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';

// Resolve card image URL: use backend base URL for relative paths so images load from Railway.
const getCardImageSrc = (card) => {
  if (card.image) return card.image;
  if (!card.imageUrl) return null;
  if (card.imageUrl.startsWith('http')) return card.imageUrl;
  const base = getBackendBaseUrl();
  const path = card.imageUrl.startsWith('/') ? card.imageUrl : `/${card.imageUrl}`;
  return base ? `${base}${path}` : null;
};

// Renders card image or placeholder when URL is missing or image fails to load (e.g. 404 after deploy).
const CardImage = ({ src, alt = 'Business card', className }) => {
  const [error, setError] = useState(false);
  const showPlaceholder = !src || error;
  if (showPlaceholder) {
    return (
      <div className={`flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/10 text-white/40 ${className || ''}`}>
        <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 mb-2" />
        <span className="text-xs sm:text-sm">Business card</span>
        <span className="text-xs text-white/30 mt-1">Image unavailable</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        if (typeof console !== 'undefined') console.warn('[CardImage] Failed to load:', src);
        setError(true);
      }}
    />
  );
};

const BusinessCardScanner = () => {
  const { user } = useAuth();
  const [myCards, setMyCards] = useState([]);
  const [orgCards, setOrgCards] = useState([]);
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'company'
  const [selectedCard, setSelectedCard] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingCardId, setDeletingCardId] = useState(null);
  const [invalidCardMessage, setInvalidCardMessage] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const cards = activeTab === 'mine' ? myCards : orgCards;
  const canEditDelete = activeTab === 'mine';

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    if (!invalidCardMessage) return undefined;
    const timeout = setTimeout(() => setInvalidCardMessage(null), 10000);
    return () => clearTimeout(timeout);
  }, [invalidCardMessage]);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      const [mineRes, orgRes] = await Promise.all([
        api.get('/business-cards/mine'),
        api.get('/business-cards'),
      ]);
      setMyCards(mineRes.data || []);
      setOrgCards(orgRes.data || []);
    } catch (error) {
      console.error('Failed to load cards:', error);
      showNotification('Failed to load cards', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const processImage = async (file) => {
    setIsScanning(true);
    try {
      const optimizedFile = await ensureImageUnderLimit(file);
      const formData = new FormData();
      formData.append('file', optimizedFile);
      const scanRes = await api.post('/business-cards/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { extractedData, imageUrl } = scanRes.data;
      const payload = {
        imageUrl,
        extractedData,
        name: extractedData?.name ?? null,
        email: extractedData?.email ?? null,
        company: extractedData?.company ?? null,
        phone: extractedData?.phone ?? extractedData?.mobile ?? null,
      };
      await api.post('/business-cards', payload);
      await loadCards();
      showNotification('Business card scanned and saved!', 'success');
    } catch (error) {
      console.error('Scan error:', error);
      showNotification(error.response?.data?.message || error.message || 'Failed to process image.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    } else {
      showNotification('Please upload a valid image file', 'error');
    }
  };

  const handleDelete = async (cardId) => {
    setDeleteConfirm(cardId);
  };

  const confirmDelete = async () => {
    const cardId = deleteConfirm;
    setDeleteConfirm(null);
    setDeletingCardId(cardId);
    setIsDeleting(true);
    try {
      await api.delete(`/business-cards/${cardId}`);
      if (selectedCard?.id === cardId) setSelectedCard(null);
      setEditingId(null);
      await loadCards();
      showNotification('Card deleted successfully', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to delete card', 'error');
    } finally {
      setIsDeleting(false);
      setDeletingCardId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleEdit = (card) => {
    setEditingId(card.id);
    setSelectedCard(null);
  };

  const handleSave = async (updatedCard) => {
    setIsSaving(true);
    try {
      await api.patch(`/business-cards/${updatedCard.id}`, {
        name: updatedCard.name,
        email: updatedCard.email,
        company: updatedCard.company,
        phone: updatedCard.phone,
      });
      setEditingId(null);
      setSelectedCard(null);
      await loadCards();
      showNotification('Card updated successfully', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to update card', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const exportToCSV = () => {
    if (cards.length === 0) {
      showNotification('No cards to export', 'error');
      return;
    }

    const headers = ['Name', 'Title', 'Company', 'Email', 'Phone', 'Mobile', 'Website', 'Address', 'City', 'State', 'Zipcode', 'Country', 'Date Added'];
    const rows = cards.map(card => [
      card.name || '',
      card.title || '',
      card.company || '',
      card.email || '',
      card.phone || '',
      card.mobile || '',
      card.website || '',
      card.address || '',
      card.city || '',
      card.state || '',
      card.zipcode || '',
      card.country || '',
      card.createdAt ? new Date(card.createdAt).toLocaleDateString() : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-cards-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showNotification('Exported to CSV successfully', 'success');
  };

  const exportToJSON = () => {
    if (cards.length === 0) {
      showNotification('No cards to export', 'error');
      return;
    }

    const dataStr = JSON.stringify(cards, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-cards-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showNotification('Backup created successfully', 'success');
  };

  const importFromJSON = () => {
    showNotification('Import not available when using cloud storage', 'info');
  };

  const filteredCards = cards.filter(card => {
    const search = searchTerm.toLowerCase();
    return (
      card.name?.toLowerCase().includes(search) ||
      card.company?.toLowerCase().includes(search) ||
      card.email?.toLowerCase().includes(search) ||
      card.title?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-[#05070d] text-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(23,51,75,0.35),transparent_55%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(0,245,160,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%22160%22%20height%3D%22160%22%20viewBox%3D%220%200%20160%20160%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%2080h160M80%200v160%22%20stroke%3D%22rgba(255,255,255,0.03)%22%20fill%3D%22none%22/%3E%3C/svg%3E')] opacity-50"></div>
        <div className="absolute inset-y-0 w-1/2 blur-3xl opacity-30 bg-gradient-to-br from-[#00d2ff] via-transparent to-[#00f5a0] animate-aurora"></div>
      </div>

      {/* Initial Loading Screen */}
      {isLoading && <LoadingScreen />}

      {/* Global Upload/Scan Loader */}
      {isScanning && <ScanningLoader />}

      {/* Global Saving Loader */}
      {isSaving && <SavingLoader />}

      {/* Global Deleting Loader */}
      {isDeleting && <DeletingLoader />}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/20">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Delete Business Card?</h3>
              <p className="text-purple-200 mb-6">This action cannot be undone. The card will be permanently removed from your collection.</p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#00d2ff] via-[#00f5a0] to-[#00d2ff] rounded-2xl mb-3 sm:mb-4 shadow-[0_10px_40px_rgba(0,213,255,0.35)] border border-white/10">
            <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">
            Business Card Scanner
          </h1>
          <p className="text-purple-200 text-sm sm:text-base lg:text-lg">AI-powered OCR for instant contact extraction</p>
        </div>

        {/* Tabs: My Cards | Company Cards */}
        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-6 py-3 rounded-2xl font-medium transition-all ${activeTab === 'mine' ? 'bg-gradient-to-r from-[#00d2ff] to-[#00f5a0] text-[#031013]' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            My Cards ({myCards.length})
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`px-6 py-3 rounded-2xl font-medium transition-all flex items-center gap-2 ${activeTab === 'company' ? 'bg-gradient-to-r from-[#00d2ff] to-[#00f5a0] text-[#031013]' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            <Users className="w-4 h-4" /> Company Cards ({orgCards.length})
          </button>
        </div>

        {/* Action Bar - only for My Cards */}
        {canEditDelete && (
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-4 md:p-6 mb-8 shadow-[0_35px_120px_rgba(0,0,0,0.55)] border border-white/10">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isScanning}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00d2ff] via-[#00f5a0] to-[#00d2ff] text-[#031013] font-semibold shadow-[0_15px_40px_rgba(0,213,255,0.45)] hover:shadow-[0_20px_60px_rgba(0,245,160,0.4)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  {isScanning ? 'Scanning...' : 'Take Photo'}
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-[#111827] to-[#0b1220] border border-white/10 text-white/90 hover:text-white transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
                >
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  {isScanning ? 'Scanning...' : 'From Gallery'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {cards.length > 0 && (
                  <button
                    onClick={exportToCSV}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/10 font-medium text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    Export CSV
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-9 sm:pl-10 pr-4 py-3 bg-[#0b1220]/80 text-white placeholder-white/50 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#00f5a0]/60 backdrop-blur-sm text-sm sm:text-base"
                  />
                </div>
                
                <div className="flex gap-2 bg-white/5 rounded-2xl p-1 border border-white/10 self-center">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-gradient-to-r from-[#00d2ff] to-[#00f5a0] text-[#041013]' : 'text-white/60 hover:text-white'}`}
                  >
                    <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-[#00d2ff] to-[#00f5a0] text-[#041013]' : 'text-white/60 hover:text-white'}`}
                  >
                    <List className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
        )}

        {/* Main Content */}
        {cards.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full mb-4 sm:mb-6 backdrop-blur-sm border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.6)]">
              <Plus className="w-12 h-12 sm:w-16 sm:h-16 text-[#00f5a0]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3">
              {activeTab === 'mine' ? 'No cards yet' : 'No company cards yet'}
            </h3>
            <p className="text-white/60 mb-4 sm:mb-6 text-sm sm:text-base px-4">
              {activeTab === 'mine' ? 'Upload your first business card to get started' : 'Cards uploaded by colleagues will appear here'}
            </p>
            {canEditDelete && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#00d2ff] to-[#00f5a0] text-[#031013] rounded-2xl hover:opacity-90 transition-all duration-300 shadow-[0_20px_60px_rgba(0,213,255,0.45)] transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
              >
                Upload Business Card
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6' : 'space-y-3 sm:space-y-4'}>
            {filteredCards.map(card => (
              <CardItem
                key={card.id}
                card={card}
                getImageSrc={getCardImageSrc}
                viewMode={viewMode}
                canEditDelete={canEditDelete}
                isEditing={editingId === card.id}
                isDeleting={deletingCardId === card.id}
                onEdit={() => handleEdit(card)}
                onDelete={() => handleDelete(card.id)}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
                onSelect={() => setSelectedCard(card)}
              />
            ))}
          </div>
        )}
      </div>

      {invalidCardMessage && (
        <InvalidCardModal
          message={invalidCardMessage}
          onClose={() => setInvalidCardMessage(null)}
        />
      )}

      {/* Detail Modal */}
      {selectedCard && editingId !== selectedCard.id && (
        <CardDetailModal
          card={selectedCard}
          getImageSrc={getCardImageSrc}
          canEditDelete={canEditDelete}
          onClose={() => setSelectedCard(null)}
          onEdit={() => handleEdit(selectedCard)}
          onDelete={() => handleDelete(selectedCard.id)}
        />
      )}

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes aurora {
          0% { transform: translateX(-20%); opacity: 0.2; }
          50% { transform: translateX(10%); opacity: 0.4; }
          100% { transform: translateX(30%); opacity: 0.25; }
        }
        .animate-aurora {
          animation: aurora 14s ease-in-out infinite alternate;
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes spin3d {
          0% { transform: rotateY(0deg) rotateX(0deg); }
          100% { transform: rotateY(360deg) rotateX(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }
          50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.8); }
        }
        @keyframes bounce-rotate {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(5deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-10px) rotate(-5deg); }
        }
        @keyframes card-fly {
          0% { transform: translateX(-100%) rotate(-10deg); opacity: 0; }
          50% { transform: translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(100%) rotate(10deg); opacity: 0; }
        }
        @keyframes trash-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        @keyframes shrink-fade {
          0% { 
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% { 
            transform: scale(0.95) rotate(-2deg);
            opacity: 0.8;
          }
          100% { 
            transform: scale(0.8) rotate(5deg);
            opacity: 0;
          }
        }
        .deleting-card {
          animation: shrink-fade 0.6s ease-out forwards;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

// Loading Screen Component
const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-[#05070d] z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'spin3d 2s infinite linear' }}>
            <div className="w-24 h-16 bg-gradient-to-r from-[#00d2ff] to-[#00f5a0] rounded-2xl shadow-[0_15px_40px_rgba(0,213,255,0.4)]" style={{ animation: 'pulse-glow 2s infinite' }}></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-[#00f5a0] rounded-full absolute" style={{ animation: 'float 2s infinite', top: '0', left: '50%' }}></div>
            <div className="w-3 h-3 bg-[#00d2ff] rounded-full absolute" style={{ animation: 'float 2s infinite 0.5s', bottom: '0', left: '50%' }}></div>
            <div className="w-3 h-3 bg-white/70 rounded-full absolute" style={{ animation: 'float 2s infinite 1s', left: '0', top: '50%' }}></div>
            <div className="w-3 h-3 bg-white/50 rounded-full absolute" style={{ animation: 'float 2s infinite 1.5s', right: '0', top: '50%' }}></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Loading Cards...</h2>
        <p className="text-white/60">Please wait</p>
      </div>
    </div>
  );
};

const ScanningLoader = () => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-[#08111d] rounded-3xl p-8 border border-white/10 shadow-[0_35px_120px_rgba(0,0,0,0.7)] max-w-md w-full mx-4">
        <div className="text-center space-y-5">
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
            <div className="absolute inset-2 rounded-full border-t-4 border-[#00f5a0]" style={{ animation: 'spin 1.4s linear infinite' }}></div>
            <div className="absolute inset-6 rounded-full bg-gradient-to-r from-[#00d2ff] to-[#00f5a0] opacity-30 blur-xl"></div>
            <Camera className="w-12 h-12 text-[#00f5a0] absolute inset-0 m-auto" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white mb-2">Processing Image</h3>
            <p className="text-white/70 text-sm sm:text-base">Hang tight while we compress, upload, and read the card details.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Saving Loader Component
const SavingLoader = () => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-[#0a0f18] rounded-3xl p-8 border border-white/10 shadow-[0_35px_120px_rgba(0,0,0,0.7)]">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <Save className="w-12 h-12 text-[#00f5a0]" style={{ animation: 'bounce-rotate 1s infinite' }} />
            </div>
            <div className="absolute inset-0 border-4 border-[#00f5a0] rounded-full opacity-20" style={{ animation: 'ping 1s infinite' }}></div>
            <div className="absolute inset-0 border-4 border-[#00d2ff] rounded-full opacity-10" style={{ animation: 'ping 1s infinite 0.5s' }}></div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Saving Changes...</h3>
          <p className="text-white/60 text-sm">Your card is being updated</p>
        </div>
      </div>
    </div>
  );
};

// Deleting Loader Component
const DeletingLoader = () => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-[#0a0f18] rounded-3xl p-8 border border-white/10 shadow-[0_35px_120px_rgba(0,0,0,0.7)]">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-6 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-10 bg-gradient-to-br from-[#ff4d4d] to-[#ff6b6b] rounded-lg absolute" style={{ animation: 'card-fly 2s infinite' }}></div>
              <div className="w-16 h-10 bg-gradient-to-br from-[#ff7557] to-[#ff4d4d] rounded-lg absolute" style={{ animation: 'card-fly 2s infinite 0.5s' }}></div>
              <div className="w-16 h-10 bg-gradient-to-br from-[#ff8f57] to-[#ff4d4d] rounded-lg absolute" style={{ animation: 'card-fly 2s infinite 1s' }}></div>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              <Trash2 className="w-12 h-12 text-[#ff6b6b]" style={{ animation: 'trash-shake 0.5s infinite' }} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Deleting Card...</h3>
          <p className="text-white/60 text-sm">Removing from collection</p>
        </div>
      </div>
    </div>
  );
};

const CardItem = ({ card, getImageSrc, viewMode, canEditDelete, isEditing, isDeleting, onEdit, onDelete, onSave, onCancel, onSelect }) => {
  const [formData, setFormData] = useState(card);
  const imgSrc = getImageSrc ? getImageSrc(card) : card.image;

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  if (isEditing && canEditDelete) {
    return (
      <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 shadow-[0_25px_90px_rgba(0,0,0,0.55)] border border-white/10">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Edit Card</h3>
        <div className="space-y-2 sm:space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {['name', 'title', 'company', 'email', 'phone', 'mobile', 'website', 'address', 'city', 'state', 'zipcode', 'country'].map(field => (
            <div key={field}>
              <label className="text-xs sm:text-sm text-white/60 capitalize block mb-1">{field}</label>
              <input
                type="text"
                value={formData[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full px-3 py-2 bg-[#0b1220]/70 text-white text-sm sm:text-base rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#00f5a0]/60 placeholder-white/40"
                placeholder={`Enter ${field}`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3 sm:mt-4">
          <button
            onClick={() => onSave(formData)}
            className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#00f5a0] to-[#00d2ff] text-[#041013] rounded-xl hover:opacity-90 transition-all text-sm sm:text-base font-semibold"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={() => { onCancel(); }}
            className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white/10 text-white rounded-xl border border-white/10 hover:bg-white/20 transition-all text-sm sm:text-base"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className={`bg-white/5 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 shadow-[0_25px_90px_rgba(0,0,0,0.6)] border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer ${isDeleting ? 'deleting-card' : ''}`} onClick={onSelect}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <CardImage src={imgSrc} alt="Business card" className="w-full sm:w-32 h-32 sm:h-20 object-cover rounded-lg" />
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
            <div>
              <p className="text-xs sm:text-sm text-white/60">Name</p>
              <p className="text-white font-medium text-sm sm:text-base">{card.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white/60">Company</p>
              <p className="text-white font-medium text-sm sm:text-base">{card.company || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white/60">Email</p>
              <p className="text-white font-medium truncate text-sm sm:text-base">{card.email || 'N/A'}</p>
            </div>
          </div>
          {canEditDelete && (
            <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex-1 sm:flex-initial p-2 bg-gradient-to-r from-[#00f5a0] to-[#00d2ff] text-[#031013] rounded-xl hover:opacity-90 transition-all">
                <Edit2 className="w-4 h-4 mx-auto" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="flex-1 sm:flex-initial p-2 bg-white/10 text-white rounded-xl border border-white/10 hover:bg-white/20 transition-all transform hover:scale-105 active:scale-95">
                <Trash2 className="w-4 h-4 mx-auto" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-[0_30px_110px_rgba(0,0,0,0.6)] border border-white/10 hover:scale-105 transition-all duration-300 cursor-pointer group ${isDeleting ? 'deleting-card' : ''}`} onClick={onSelect}>
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <CardImage src={imgSrc} alt="Business card" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      <div className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-1 truncate">{card.name || 'Unknown'}</h3>
        <p className="text-white/60 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-1">{card.title || 'No title'} {card.company ? `at ${card.company}` : ''}</p>
        {!canEditDelete && card.user?.fullName && (
          <p className="text-white/40 text-xs mb-2">Uploaded by {card.user.fullName}</p>
        )}
        <div className="space-y-2 text-xs sm:text-sm">
          {card.email && (
            <div className="flex items-center gap-2 text-white/70">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{card.email}</span>
            </div>
          )}
          {card.phone && (
            <div className="flex items-center gap-2 text-white/70">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{card.phone}</span>
            </div>
          )}
        </div>
        {canEditDelete && (
          <div className="flex gap-2 mt-3 sm:mt-4">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex-1 flex items-center justify-center gap-2 px-2 sm:px-3 py-2 bg-gradient-to-r from-[#00f5a0] to-[#00d2ff] text-[#031013] rounded-xl hover:opacity-90 transition-all text-xs sm:text-sm transform hover:scale-105 active:scale-95">
              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="flex-1 flex items-center justify-center gap-2 px-2 sm:px-3 py-2 bg-white/10 text-white rounded-xl border border-white/10 hover:bg-white/20 transition-all text-xs sm:text-sm transform hover:scale-105 active:scale-95">
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CardDetailModal = ({ card, getImageSrc, canEditDelete, onClose, onEdit, onDelete }) => {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleEdit = () => {
    onClose();
    onEdit();
  };

  const handleDelete = () => {
    onClose();
    onDelete();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#0a0f18] rounded-3xl max-w-4xl w-full my-4 sm:my-8 shadow-[0_40px_140px_rgba(0,0,0,0.7)] border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#00d2ff] to-[#00f5a0] p-4 sm:p-6 flex items-center justify-between border-b border-white/10 sticky top-0 z-10 rounded-t-3xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Contact Details</h2>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white/90" />
          </button>
        </div>
        
        <div className="p-4 sm:p-8 max-h-[calc(90vh-80px)] overflow-y-auto space-y-6">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <CardImage src={getImageSrc ? getImageSrc(card) : card.image} className="w-full rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] border border-white/10 min-h-[200px]" />
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#00f5a0]" />
                  <h3 className="text-base sm:text-lg font-semibold text-white">Personal Info</h3>
                </div>
                <div className="bg-white/5 rounded-xl p-3 sm:p-4 space-y-2 backdrop-blur-sm border border-white/10">
                  <p className="text-white/60 text-xs sm:text-sm">Name</p>
                  <p className="text-white font-medium text-base sm:text-lg">{card.name || 'N/A'}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-[#00f5a0]" />
                  <h3 className="text-base sm:text-lg font-semibold text-white">Professional</h3>
                </div>
                <div className="bg-white/5 rounded-xl p-3 sm:p-4 space-y-3 backdrop-blur-sm border border-white/10">
                  {card.title && (
                    <div>
                      <p className="text-white/60 text-xs sm:text-sm">Title</p>
                      <p className="text-white font-medium text-sm sm:text-base">{card.title}</p>
                    </div>
                  )}
                  {card.company && (
                    <div>
                      <p className="text-white/60 text-xs sm:text-sm">Company</p>
                      <p className="text-white font-medium text-sm sm:text-base">{card.company}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#00f5a0]" />
                  <h3 className="text-base sm:text-lg font-semibold text-white">Contact</h3>
                </div>
                <div className="bg-white/5 rounded-xl p-3 sm:p-4 space-y-3 backdrop-blur-sm border border-white/10">
                  {card.email && (
                    <div>
                      <p className="text-white/60 text-xs sm:text-sm">Email</p>
                      <a href={`mailto:${card.email}`} className="text-[#8be9ff] hover:text-white transition-colors text-sm sm:text-base break-all">{card.email}</a>
                    </div>
                  )}
                  {card.phone && (
                    <div>
                      <p className="text-white/60 text-xs sm:text-sm">Phone</p>
                      <a href={`tel:${card.phone}`} className="text-[#8be9ff] hover:text-white transition-colors text-sm sm:text-base">{card.phone}</a>
                    </div>
                  )}
                  {card.mobile && (
                    <div>
                      <p className="text-white/60 text-xs sm:text-sm">Mobile</p>
                      <a href={`tel:${card.mobile}`} className="text-[#8be9ff] hover:text-white transition-colors text-sm sm:text-base">{card.mobile}</a>
                    </div>
                  )}
                  {card.website && (
                    <div>
                      <p className="text-white/60 text-xs sm:text-sm">Website</p>
                      <a href={card.website.startsWith('http') ? card.website : `https://${card.website}`} target="_blank" rel="noopener noreferrer" className="text-[#8be9ff] hover:text-white transition-colors text-sm sm:text-base break-all">{card.website}</a>
                    </div>
                  )}
                </div>
              </div>

              {(card.address || card.city || card.state || card.zipcode || card.country) && (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#00f5a0]" />
                    <h3 className="text-base sm:text-lg font-semibold text-white">Location</h3>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-white/10">
                    <p className="text-white text-sm sm:text-base">
                      {[card.address, card.city, card.state, card.zipcode, card.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {canEditDelete && (
            <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
              <button onClick={handleEdit} className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#00f5a0] to-[#00d2ff] text-[#031013] rounded-xl hover:opacity-90 transition-all shadow-lg font-medium text-sm sm:text-base">
                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Edit Card
              </button>
              <button onClick={handleDelete} className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white/10 text-white rounded-xl border border-white/10 hover:bg-white/15 transition-all shadow-lg font-medium text-sm sm:text-base">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Delete Card
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InvalidCardModal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-red-500 via-pink-500 to-red-600 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-white shadow-2xl border border-white/30 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all"
          aria-label="Close invalid image modal"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <Camera className="w-6 h-6" />
          <h3 className="text-xl font-semibold">Upload a Business Card</h3>
        </div>
        <p className="text-base leading-relaxed text-white/90 whitespace-pre-line">{message}</p>
        <p className="mt-4 text-sm text-white/80">Please upload a clear photo of a business card to continue.</p>
      </div>
    </div>
  );
};

export default BusinessCardScanner;
