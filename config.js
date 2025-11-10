// EcoSphere Configuration File
// Centralized configuration for all application files

const EcoSphereConfig = {
    // Application Info
    app: {
        name: 'EcoSphere',
        title: '🌱 EcoSphere - Smart Waste Management',
        description: 'EcoSphere - Smart Waste Management & Location Tracking System',
        version: '1.0.0'
    },

    // Storage Configuration
    storage: {
        reportsKey: 'ecosphere-reports',
        maxStorageSize: 4 * 1024 * 1024, // 4MB in bytes
        storageThreshold: 0.9 // 90% of max size before cleanup
    },

    // Image Configuration
    image: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxWidth: 800,
        maxHeight: 800,
        compressionQuality: 0.7,
        acceptedFormats: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif']
    },

    // Location Configuration
    location: {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0,
        mapZoom: 18
    },

    // Map Configuration
    map: {
        provider: 'openstreetmap', // 'openstreetmap' or 'google'
        openstreetmapBaseUrl: 'https://www.openstreetmap.org',
        googleMapsBaseUrl: 'https://www.google.com/maps',
        graphhopperUrl: 'https://graphhopper.com/maps'
    },

    // Report Status Configuration
    status: {
        default: 'reported',
        options: ['reported', 'in-progress', 'resolved'],
        labels: {
            'reported': 'Reported',
            'in-progress': 'In Progress',
            'resolved': 'Resolved'
        },
        icons: {
            'reported': '⚠️',
            'in-progress': '🔄',
            'resolved': '✅'
        }
    },

    // UI Configuration
    ui: {
        statsUpdateInterval: 2000, // 2 seconds
        animationDuration: 500, // milliseconds
        fadeInDuration: 300 // milliseconds
    },

    // Messages
    messages: {
        locationDetected: 'Location detected successfully!',
        locationExtracted: 'Location extracted from image GPS data!',
        noGPSInImage: 'No GPS data in image. Click "Get My Location" to use device location.',
        clickToDetect: 'Click "Get My Location" to detect your location.',
        processingImage: 'Processing image...',
        reportSubmitted: 'Report Submitted!',
        reportSubmittedDesc: 'Thank you for helping keep our planet clean. Your report has been saved.',
        storageFull: 'Storage is full. Please clear your browser storage or use a different browser.',
        storageFullRemoveOld: 'Storage was getting full. Some older reports were removed to save space.',
        confirmDelete: 'Are you sure you want to delete this report? This action cannot be undone.',
        noReports: 'No reports yet. Be the first to help keep our planet clean!',
        noReportsFiltered: 'No reports found. Try selecting a different filter.',
        locationRequired: 'Please upload an image and detect your location',
        locationNeeded: 'Your location is needed for routing. Get your location now?',
        getLocationFirst: 'Please get your location first to view routes.'
    },

    // External Libraries
    libraries: {
        exif: {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/exif-js/2.3.0/exif.min.js',
            enabled: true
        }
    },

    // Date Formatting
    dateFormat: {
        locale: 'en-US',
        options: {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }
    }
};

// Make config available globally
if (typeof window !== 'undefined') {
    window.EcoSphereConfig = EcoSphereConfig;
}

// Export for Node.js environments (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EcoSphereConfig;
}

