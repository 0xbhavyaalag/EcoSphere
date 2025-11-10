// Global state
let currentLocation = null;
let currentImage = null;
let reports = [];
let userLocation = null; // Store user's current location for routing

// Get configuration (ensure it's loaded)
const config = window.EcoSphereConfig || {
    storage: { 
        reportsKey: 'ecosphere-reports',
        maxStorageSize: 4 * 1024 * 1024,
        storageThreshold: 0.9
    },
    image: { 
        maxFileSize: 10 * 1024 * 1024,
        maxWidth: 800,
        maxHeight: 800,
        compressionQuality: 0.7
    },
    location: { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
    },
    map: { 
        mapZoom: 18,
        openstreetmapBaseUrl: 'https://www.openstreetmap.org',
        googleMapsBaseUrl: 'https://www.google.com/maps',
        graphhopperUrl: 'https://graphhopper.com/maps'
    },
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
    ui: { 
        statsUpdateInterval: 2000, 
        animationDuration: 500 
    },
    messages: {},
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

// Load reports from localStorage
try {
    const stored = localStorage.getItem(config.storage.reportsKey);
    if (stored) {
        reports = JSON.parse(stored);
        console.log('Loaded reports from localStorage:', reports.length);
    }
} catch (error) {
    console.error('Error loading reports from localStorage:', error);
    reports = [];
}

// DOM Elements
const imageInput = document.getElementById('imageInput');
const cameraInput = document.getElementById('cameraInput');
const cameraBtn = document.getElementById('cameraBtn');
const imagePreview = document.getElementById('imagePreview');
const uploadLabel = document.querySelector('.upload-label');
const getLocationBtn = document.getElementById('getLocationBtn');
const locationStatus = document.getElementById('locationStatus');
const locationInfo = document.getElementById('locationInfo');
const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');
const mapLinkContainer = document.getElementById('mapLinkContainer');
const description = document.getElementById('description');
const submitBtn = document.getElementById('submitBtn');
const reportForm = document.getElementById('reportForm');
const reportsList = document.getElementById('reportsList');
const filterButtons = document.querySelectorAll('.filter-btn');
const successModal = document.getElementById('successModal');
const closeModal = document.getElementById('closeModal');
const viewHistoryBtn = document.getElementById('viewHistoryBtn');
const totalReportsEl = document.getElementById('totalReports');
const inProgressReportsEl = document.getElementById('inProgressReports');
const resolvedReportsEl = document.getElementById('resolvedReports');
const editLocationBtn = document.getElementById('editLocationBtn');
const locationDisplay = document.getElementById('locationDisplay');
const locationEdit = document.getElementById('locationEdit');
const manualLatitude = document.getElementById('manualLatitude');
const manualLongitude = document.getElementById('manualLongitude');
const saveLocationBtn = document.getElementById('saveLocationBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const municipalInfo = document.getElementById('municipalInfo');
const municipalDetails = document.getElementById('municipalDetails');

// Camera state removed - using native camera directly

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    renderReports();
    updateStats();
    
    // Update stats at configured interval to ensure real-time updates
    setInterval(() => {
        updateStats();
    }, config.ui.statsUpdateInterval || 2000);
    // Enhanced entrance animations with stagger
    setTimeout(() => {
        const cards = document.querySelectorAll('.reports-list .report-card');
        cards.forEach((c, i) => {
            c.style.animationDelay = (i * 100) + 'ms';
            c.style.animationFillMode = 'both';
        });
        
        // Add scroll-triggered animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = `fadeInUp 600ms cubic-bezier(0.4, 0, 0.2, 1) both ${entry.target.dataset.delay || '0ms'}`;
                }
            });
        }, { threshold: 0.1 });
        
        // Observe all cards and sections
        document.querySelectorAll('.card, .report-card, .stat-item').forEach((el, i) => {
            el.dataset.delay = (i * 50) + 'ms';
            observer.observe(el);
        });
    }, 200);
});

// Update Hero Stats with smooth animation
function updateStats() {
    // Calculate stats from current in-memory reports array (most up-to-date)
    const total = reports.length;
    const inProgress = reports.filter(r => r.status === 'in-progress').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    
    // Get elements fresh in case they weren't loaded when script ran
    const totalEl = document.getElementById('totalReports');
    const inProgressEl = document.getElementById('inProgressReports');
    const resolvedEl = document.getElementById('resolvedReports');
    
    // Get current displayed values from elements (before animation)
    const currentTotal = parseInt(totalEl?.textContent?.trim() || '0');
    const currentInProgress = parseInt(inProgressEl?.textContent?.trim() || '0');
    const currentResolved = parseInt(resolvedEl?.textContent?.trim() || '0');
    
    // Animate counting effect from current value to new value
    const animDuration = config.ui.animationDuration || 500;
    
    // Only animate if values actually changed
    if (totalEl && currentTotal !== total) {
        animateValue(totalEl, currentTotal, total, animDuration);
    } else if (totalEl && currentTotal === total) {
        // Ensure display is correct even if no animation needed
        totalEl.textContent = total;
    }
    
    if (inProgressEl && currentInProgress !== inProgress) {
        animateValue(inProgressEl, currentInProgress, inProgress, animDuration);
    } else if (inProgressEl && currentInProgress === inProgress) {
        inProgressEl.textContent = inProgress;
    }
    
    if (resolvedEl && currentResolved !== resolved) {
        animateValue(resolvedEl, currentResolved, resolved, animDuration);
    } else if (resolvedEl && currentResolved === resolved) {
        resolvedEl.textContent = resolved;
    }
    
    // Also update the stored references if they exist
    if (totalReportsEl) {
        if (currentTotal !== total) {
            animateValue(totalReportsEl, currentTotal, total, animDuration);
        } else {
            totalReportsEl.textContent = total;
        }
    }
    if (inProgressReportsEl) {
        if (currentInProgress !== inProgress) {
            animateValue(inProgressReportsEl, currentInProgress, inProgress, animDuration);
        } else {
            inProgressReportsEl.textContent = inProgress;
        }
    }
    if (resolvedReportsEl) {
        if (currentResolved !== resolved) {
            animateValue(resolvedReportsEl, currentResolved, resolved, animDuration);
        } else {
            resolvedReportsEl.textContent = resolved;
        }
    }
    
    console.log('Stats updated:', { total, inProgress, resolved, current: { currentTotal, currentInProgress, currentResolved } });
}

// Animate counting numbers
let animationTimers = {}; // Store timers to prevent overlapping animations

function animateValue(element, start, end, duration) {
    if (!element) return;
    
    // Clear any existing animation for this element
    if (animationTimers[element.id]) {
        clearInterval(animationTimers[element.id]);
    }
    
    // Use the start parameter provided, fallback to element's current value
    const currentValue = parseInt(element.textContent) || 0;
    const startVal = (start !== undefined && start !== null) ? start : currentValue;
    
    // If already at target, skip animation
    if (startVal === end) return;
    
    const range = end - startVal;
    const increment = range > 0 ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / Math.abs(range)));
    
    if (stepTime < 1 || Math.abs(range) === 0) {
        element.textContent = end;
        return;
    }
    
    let current = startVal;
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
            delete animationTimers[element.id];
        }
        element.textContent = current;
    }, stepTime);
    
    animationTimers[element.id] = timer;
}

// Event Listeners
function initializeEventListeners() {
    // Image upload
    imageInput.addEventListener('change', handleImageSelect);
    uploadLabel.addEventListener('dragover', handleDragOver);
    uploadLabel.addEventListener('dragleave', handleDragLeave);
    uploadLabel.addEventListener('drop', handleDrop);
    
    // Camera
    if (cameraBtn) {
        cameraBtn.addEventListener('click', handleCameraClick);
    }
    if (cameraInput) {
        cameraInput.addEventListener('change', handleCameraFileSelect);
    }
    
    // Location
    getLocationBtn.addEventListener('click', () => getCurrentLocation(null));
    
    // Manual location editing
    if (editLocationBtn) {
        editLocationBtn.addEventListener('click', () => {
            locationDisplay.classList.add('hidden');
            locationEdit.classList.remove('hidden');
            if (currentLocation) {
                manualLatitude.value = currentLocation.latitude.toFixed(6);
                manualLongitude.value = currentLocation.longitude.toFixed(6);
            }
        });
    }
    
    if (saveLocationBtn) {
        saveLocationBtn.addEventListener('click', saveManualLocation);
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            locationDisplay.classList.remove('hidden');
            locationEdit.classList.add('hidden');
        });
    }
    
    // Form submission
    reportForm.addEventListener('submit', handleFormSubmit);
    
    // Filters
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => handleFilterClick(btn));
    });
    
    // Modal
    closeModal.addEventListener('click', () => {
        successModal.classList.add('hidden');
    });
    
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.add('hidden');
        }
    });
    
    // View History Button
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', () => {
            document.getElementById('reports')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Hero "How it works" quick-scroll
    const heroHowBtn = document.getElementById('heroHowBtn');
    if (heroHowBtn) {
        heroHowBtn.addEventListener('click', () => {
            const target = document.getElementById('upload');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                highlightElement(target);
            }
        });
    }
}

// Small helper to briefly highlight an element to draw attention
function highlightElement(el, duration = 1800) {
    if (!el) return;
    el.classList.add('highlight');
    setTimeout(() => el.classList.remove('highlight'), duration);
}

// Image Upload Functions
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processImageFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadLabel.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadLabel.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadLabel.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        imageInput.files = e.dataTransfer.files;
        processImageFile(file);
    }
}

// Compress image to reduce localStorage size
function compressImage(file, maxWidth = config.image.maxWidth, maxHeight = config.image.maxHeight, quality = config.image.compressionQuality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve(compressed);
            };
            img.onerror = () => resolve(e.target.result); // Fallback to original
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function processImageFile(file) {
    // Validate file size using config
    if (file.size > config.image.maxFileSize) {
        alert(`File size must be less than ${(config.image.maxFileSize / 1024 / 1024).toFixed(0)}MB`);
        return;
    }
    
    // Show loading message
    if (locationStatus) {
        locationStatus.textContent = config.messages.processingImage || 'Processing image...';
        locationStatus.className = 'location-status loading';
        locationStatus.classList.remove('hidden');
    }
    
    // Compress and process image
    compressImage(file).then((compressedImage) => {
        currentImage = compressedImage;
        displayImagePreview(compressedImage);
        
        // Try to extract GPS from EXIF data
        if (typeof EXIF !== 'undefined') {
            EXIF.getData(file, function() {
                const latArr = EXIF.getTag(this, "GPSLatitude");
                const lonArr = EXIF.getTag(this, "GPSLongitude");
                const latRef = EXIF.getTag(this, "GPSLatitudeRef");
                const lonRef = EXIF.getTag(this, "GPSLongitudeRef");
                
                if (latArr && lonArr && latRef && lonRef) {
                    // Convert DMS to decimal degrees
                    const lat = convertDMSToDD(latArr[0], latArr[1], latArr[2], latRef);
                    const lon = convertDMSToDD(lonArr[0], lonArr[1], lonArr[2], lonRef);
                    
                    currentLocation = {
                        latitude: lat,
                        longitude: lon,
                        accuracy: 0,
                        source: 'gps'
                    };
                    
                    displayLocationInfo(currentLocation);
                    if (locationStatus) {
                        locationStatus.textContent = config.messages.locationExtracted || 'Location extracted from image GPS data!';
                        locationStatus.className = 'location-status success';
                        locationStatus.classList.remove('hidden');
                    }
                    checkFormValidity();
                } else {
                    // No GPS in image, show option to get device location
                    if (locationStatus) {
                        locationStatus.textContent = config.messages.noGPSInImage || 'No GPS data in image. Click "Get My Location" to use device location.';
                        locationStatus.className = 'location-status';
                        locationStatus.classList.remove('hidden');
                    }
                    checkFormValidity();
                }
            });
        } else {
            // EXIF library not loaded, prompt for manual location
            if (locationStatus) {
                locationStatus.textContent = config.messages.clickToDetect || 'Click "Get My Location" to detect your location.';
                locationStatus.className = 'location-status';
                locationStatus.classList.remove('hidden');
            }
            checkFormValidity();
        }
    });
}

// Helper function to convert DMS to Decimal Degrees
function convertDMSToDD(degrees, minutes, seconds, direction) {
    let dd = degrees + minutes / 60 + seconds / (60 * 60);
    if (direction === "S" || direction === "W") dd = dd * -1;
    return dd;
}

function displayImagePreview(imageSrc) {
    imagePreview.innerHTML = `
        <div style="position: relative;">
            <img src="${imageSrc}" alt="Preview">
            <button type="button" class="remove-image" onclick="removeImage()">×</button>
        </div>
    `;
    imagePreview.classList.remove('hidden');
    uploadLabel.style.display = 'none';
}

function removeImage() {
    currentImage = null;
    imageInput.value = '';
    if (cameraInput) cameraInput.value = '';
    imagePreview.classList.add('hidden');
    uploadLabel.style.display = 'flex';
    checkFormValidity();
}

// Camera Functions
function handleCameraClick() {
    // Directly open native camera by clicking the file input with capture attribute
    if (cameraInput) {
        cameraInput.click();
    } else {
        alert('Camera is not supported on this device. Please use the file upload option.');
    }
}

// Camera preview functions removed - using native camera directly

function handleCameraFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processImageFile(file);
    }
}

// Location Functions
function getCurrentLocation(callback) {
	const isSecureContext = window.isSecureContext || ['https:', 'chrome-extension:'].includes(window.location.protocol);

	if (getLocationBtn) getLocationBtn.disabled = true;
	if (locationStatus) {
		locationStatus.textContent = 'Detecting your location...';
		locationStatus.className = 'location-status loading';
		locationStatus.classList.remove('hidden');
	}

	const handleSuccess = (location) => {
		currentLocation = location;
		userLocation = { lat: location.latitude, lon: location.longitude };
		if (displayLocationInfo) displayLocationInfo(currentLocation);
		if (showLocationSuccess) showLocationSuccess(config.messages.locationDetected || 'Location detected successfully!');
		if (checkFormValidity) checkFormValidity();
		if (getLocationBtn) getLocationBtn.disabled = false;
		if (callback) callback(true);
	};

	const handleFailure = (message) => {
		if (showLocationError) showLocationError(message || 'Unable to retrieve your location');
		if (getLocationBtn) getLocationBtn.disabled = false;
		if (callback) callback(false);
	};

	// If insecure context, try IP-based fallback first
	if (!isSecureContext) {
		if (locationStatus) {
			locationStatus.textContent = 'Secure GPS not available. Using approximate location...';
		}
		getApproxLocationViaIP()
			.then((approx) => handleSuccess(approx))
			.catch(() => handleFailure('Please open this site over HTTPS or localhost to use precise GPS.'));
		return;
	}

	if (!navigator.geolocation) {
		handleFailure('Geolocation is not supported by your browser');
		return;
	}

	const geoOptions = {
		enableHighAccuracy: config.location.enableHighAccuracy,
		timeout: config.location.timeout,
		maximumAge: config.location.maximumAge
	};

	navigator.geolocation.getCurrentPosition(
		(position) => {
			handleSuccess({
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				accuracy: position.coords.accuracy,
				source: 'device'
			});
		},
		(error) => {
			let errorMessage = 'Unable to retrieve your location';
			switch(error.code) {
				case error.PERMISSION_DENIED:
					errorMessage = 'Location access denied. Please enable location permissions.';
					break;
				case error.POSITION_UNAVAILABLE:
					errorMessage = 'Location information unavailable.';
					break;
				case error.TIMEOUT:
					errorMessage = 'Location request timed out.';
					break;
			}
			// As a fallback on failure, try approximate IP-based location
			getApproxLocationViaIP()
				.then((approx) => handleSuccess(approx))
				.catch(() => handleFailure(errorMessage));
		},
		geoOptions
	);
}

// Fallback: Approximate location via IP-based geolocation
async function getApproxLocationViaIP() {
	// Try multiple providers for resilience
	const providers = [
		async () => {
			const res = await fetch('https://ipapi.co/json/');
			if (!res.ok) throw new Error('ipapi.co failed');
			const data = await res.json();
			if (!data || !data.latitude || !data.longitude) throw new Error('ipapi.co invalid');
			return { latitude: data.latitude, longitude: data.longitude };
		},
		async () => {
			const res = await fetch('https://ipwho.is/');
			if (!res.ok) throw new Error('ipwho.is failed');
			const data = await res.json();
			if (!data || data.success !== true || !data.latitude || !data.longitude) throw new Error('ipwho.is invalid');
			return { latitude: data.latitude, longitude: data.longitude };
		}
	];

	let lastError;
	for (const provider of providers) {
		try {
			const coords = await provider();
			return {
				latitude: coords.latitude,
				longitude: coords.longitude,
				accuracy: 50000, // ~50km, approximate
				source: 'ip'
			};
		} catch (e) {
			lastError = e;
		}
	}
	throw lastError || new Error('IP-based geolocation failed');
}

function displayLocationInfo(location) {
    if (latitude) latitude.textContent = location.latitude.toFixed(6);
    if (longitude) longitude.textContent = location.longitude.toFixed(6);
    if (locationInfo) locationInfo.classList.remove('hidden');
    
    // Ensure location display is visible and edit is hidden
    if (locationDisplay) locationDisplay.classList.remove('hidden');
    if (locationEdit) locationEdit.classList.add('hidden');
    
    // Store user location for routing
    userLocation = { lat: location.latitude, lon: location.longitude };
    
    // Create map link with routing
    const zoom = config.map.mapZoom || 18;
    const mapUrl = `${config.map.openstreetmapBaseUrl}/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=${zoom}`;
    if (mapLinkContainer) {
        let sourceText = 'from device';
        if (location.source === 'gps') {
            sourceText = 'from image GPS';
        } else if (location.source === 'manual') {
            sourceText = 'manually entered';
        }
        mapLinkContainer.innerHTML = `
            <a href="${mapUrl}" target="_blank" class="map-link">
                <span>🗺️</span>
                <span>View on Map</span>
                <span>↗</span>
            </a>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
                Location obtained ${sourceText}
            </div>
        `;
        mapLinkContainer.classList.remove('hidden');
    }
    
    // Find and display nearest municipal authority
    findNearestMunicipalAuthority(location.latitude, location.longitude);
}

function showLocationSuccess(message) {
    if (locationStatus) {
        locationStatus.textContent = message;
        locationStatus.className = 'location-status success';
        locationStatus.classList.remove('hidden');
    }
}

function showLocationError(message) {
    if (locationStatus) {
        locationStatus.textContent = message;
        locationStatus.className = 'location-status error';
        locationStatus.classList.remove('hidden');
    }
    if (locationInfo) locationInfo.classList.add('hidden');
    currentLocation = null;
    checkFormValidity();
}

// Manual Location Editing Functions
function saveManualLocation() {
    const lat = parseFloat(manualLatitude.value);
    const lon = parseFloat(manualLongitude.value);
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lon)) {
        alert('Please enter valid latitude and longitude values.');
        return;
    }
    
    if (lat < -90 || lat > 90) {
        alert('Latitude must be between -90 and 90 degrees.');
        return;
    }
    
    if (lon < -180 || lon > 180) {
        alert('Longitude must be between -180 and 180 degrees.');
        return;
    }
    
    // Create location object
    currentLocation = {
        latitude: lat,
        longitude: lon,
        accuracy: 0,
        source: 'manual'
    };
    
    // Update display
    displayLocationInfo(currentLocation);
    
    // Show success message
    if (locationStatus) {
        locationStatus.textContent = 'Location updated manually!';
        locationStatus.className = 'location-status success';
        locationStatus.classList.remove('hidden');
    }
    
    checkFormValidity();
}

// Find Nearest Municipal Authority
async function findNearestMunicipalAuthority(lat, lon) {
    if (!municipalInfo || !municipalDetails) return;
    
    // Show loading state
    municipalInfo.classList.remove('hidden');
    municipalDetails.innerHTML = '<div class="municipal-loading">🔍 Finding nearest municipal authority...</div>';
    
    try {
        // Step 1: Reverse geocode to get address and administrative information
        const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
        
        let response;
        try {
            response = await fetch(reverseGeocodeUrl, {
                headers: {
                    'User-Agent': 'EcoSphere/1.0 (waste-management-app)'
                }
            });
            
            // Handle rate limiting
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again in a moment.');
            }
            
            if (!response.ok) {
                throw new Error(`Reverse geocoding failed: ${response.status}`);
            }
        } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            throw new Error('Unable to connect to geocoding service. Please check your internet connection.');
        }
        
        const data = await response.json();
        
        if (!data || !data.address) {
            throw new Error('No address data found for this location');
        }
        
        const address = data.address;
        
        // Extract relevant administrative information
        const city = address.city || address.town || address.village || address.municipality || address.county || '';
        const state = address.state || address.region || '';
        const country = address.country || '';
        const postalCode = address.postcode || '';
        const county = address.county || '';
        
        // Step 2: Search for municipal corporation offices nearby
        // Try different search terms based on available location data
        const searchTerms = [];
        
        if (city) {
            searchTerms.push(
                `${city} municipal corporation`,
                `${city} municipal office`,
                `${city} city corporation`,
                `${city} municipality`,
                `municipal corporation ${city}`,
                `${city} waste management`,
                `${city} sanitation department`
            );
        }
        
        if (state) {
            searchTerms.push(`${state} municipal office`);
        }
        
        // Add generic search terms if city is not available
        if (!city && state) {
            searchTerms.push(`${state} municipal corporation`);
        }
        
        let municipalOffice = null;
        let lastError = null;
        
        // Try to find municipal office using search terms
        for (const term of searchTerms) {
            const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=5&addressdetails=1`;
            
            try {
                const searchResponse = await fetch(searchUrl, {
                    headers: {
                        'User-Agent': 'EcoSphere/1.0 (waste-management-app)'
                    }
                });
                
                if (searchResponse.status === 429) {
                    lastError = 'Rate limit exceeded';
                    continue;
                }
                
                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    
                    if (searchData && searchData.length > 0) {
                        // Find the closest one to our location
                        let closestOffice = searchData[0];
                        let minDistance = calculateDistance(lat, lon, parseFloat(searchData[0].lat), parseFloat(searchData[0].lon));
                        
                        for (const office of searchData) {
                            const officeLat = parseFloat(office.lat);
                            const officeLon = parseFloat(office.lon);
                            if (isNaN(officeLat) || isNaN(officeLon)) continue;
                            
                            const distance = calculateDistance(lat, lon, officeLat, officeLon);
                            if (distance < minDistance) {
                                minDistance = distance;
                                closestOffice = office;
                            }
                        }
                        
                        municipalOffice = closestOffice;
                        break;
                    }
                }
            } catch (e) {
                console.warn('Search failed for term:', term, e);
                lastError = e.message;
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
                continue;
            }
        }
        
        // Display the information
        let html = '';
        
        if (municipalOffice) {
            const officeAddress = municipalOffice.display_name || '';
            const officeLat = parseFloat(municipalOffice.lat);
            const officeLon = parseFloat(municipalOffice.lon);
            const distance = calculateDistance(lat, lon, officeLat, officeLon);
            
            html += `
                <div class="municipal-item">
                    <span class="municipal-label">Office Name:</span>
                    <span class="municipal-value">${escapeHtml(municipalOffice.display_name.split(',')[0])}</span>
                </div>
                <div class="municipal-item">
                    <span class="municipal-label">Address:</span>
                    <span class="municipal-value">${escapeHtml(officeAddress)}</span>
                </div>
                <div class="municipal-item">
                    <span class="municipal-label">Distance:</span>
                    <span class="municipal-value">${distance < 1 ? (distance * 1000).toFixed(0) + ' meters' : distance.toFixed(2) + ' km'}</span>
                </div>
                <a href="https://www.google.com/maps/dir/${lat},${lon}/${officeLat},${officeLon}" target="_blank" class="municipal-link">
                    <span>🧭</span>
                    <span>Get Directions</span>
                </a>
            `;
        } else {
            // If no specific office found, show general administrative info
            html += `
                <div class="municipal-item">
                    <span class="municipal-label">City/Municipality:</span>
                    <span class="municipal-value">${escapeHtml(city || 'Not available')}</span>
                </div>
                <div class="municipal-item">
                    <span class="municipal-label">State/Province:</span>
                    <span class="municipal-value">${escapeHtml(state || 'Not available')}</span>
                </div>
                ${county ? `
                <div class="municipal-item">
                    <span class="municipal-label">County:</span>
                    <span class="municipal-value">${escapeHtml(county)}</span>
                </div>
                ` : ''}
                ${postalCode ? `
                <div class="municipal-item">
                    <span class="municipal-label">Postal Code:</span>
                    <span class="municipal-value">${escapeHtml(postalCode)}</span>
                </div>
                ` : ''}
                <div class="municipal-item">
                    <span class="municipal-label">Country:</span>
                    <span class="municipal-value">${escapeHtml(country || 'Not available')}</span>
                </div>
                <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius); font-size: 0.85rem; color: var(--text-secondary);">
                    ℹ️ Please contact your local ${city ? city : 'municipal'} authorities for waste management services.
                </div>
            `;
        }
        
        municipalDetails.innerHTML = html;
        
    } catch (error) {
        console.error('Error finding municipal authority:', error);
        const errorMessage = error.message || 'Unable to find municipal authority information';
        municipalDetails.innerHTML = `
            <div class="municipal-error">
                ⚠️ ${escapeHtml(errorMessage)}. Please search manually for your local municipal office.
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                Tip: You can search for "${city || 'your city'} municipal office" in Google Maps.
            </div>
        `;
    }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

// Form Validation
function checkFormValidity() {
    const submitButton = document.getElementById('submitBtn');
    if (!submitButton) return;
    
    if (currentImage && currentLocation) {
        submitButton.disabled = false;
        submitButton.style.opacity = '1';
        submitButton.style.cursor = 'pointer';
    } else {
        submitButton.disabled = true;
        submitButton.style.opacity = '0.5';
        submitButton.style.cursor = 'not-allowed';
    }
}

// Form Submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log('Form submitted', { currentImage: !!currentImage, currentLocation: !!currentLocation });
    
    if (!currentImage || !currentLocation) {
        alert(config.messages.locationRequired || 'Please upload an image and detect your location');
        return;
    }
    
    const report = {
        id: Date.now().toString(),
        image: currentImage,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        description: description?.value?.trim() || 'No description provided',
        status: config.status.default || 'reported',
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    // Add to reports array
    reports.unshift(report);
    
    // Update stats IMMEDIATELY to show the new count
    updateStats();
    
    // Save to localStorage with size checking
    try {
        const dataString = JSON.stringify(reports);
        const dataSize = new Blob([dataString]).size;
        const maxSize = config.storage.maxStorageSize;
        const threshold = maxSize * (config.storage.storageThreshold || 0.9);
        
        if (dataSize > threshold) {
            // Remove oldest reports if storage is getting full
            while (reports.length > 0 && dataSize > threshold) {
                reports.pop(); // Remove oldest report
            }
            localStorage.setItem(config.storage.reportsKey, JSON.stringify(reports));
            // Update stats after removing old reports
            updateStats();
            alert(config.messages.storageFullRemoveOld || 'Storage was getting full. Some older reports were removed to save space.');
        }
        
        localStorage.setItem(config.storage.reportsKey, JSON.stringify(reports));
        console.log('Report saved successfully', report);
        console.log('Storage size:', (dataSize / 1024 / 1024).toFixed(2), 'MB');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        
        // Check if it's a quota exceeded error
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            // Try to remove oldest reports and save again
            if (reports.length > 1) {
                reports.pop(); // Remove oldest report
                try {
                    localStorage.setItem(config.storage.reportsKey, JSON.stringify(reports));
                    alert('Storage is full. Removed an old report. Please try submitting again.');
                    return;
                } catch (e) {
                    alert('Storage is full. Please delete some old reports manually or clear your browser storage.');
                    return;
                }
            } else {
                alert(config.messages.storageFull || 'Storage is full. Please clear your browser storage or use a different browser.');
                return;
            }
        } else {
            alert('Error saving report: ' + error.message + '. Please try again.');
            return;
        }
    }
    
    // Reset form
    resetForm();
    
    // Show success modal with config messages
    if (successModal) {
        const modalTitle = successModal.querySelector('h3');
        const modalText = successModal.querySelector('p');
        if (modalTitle && config.messages.reportSubmitted) {
            modalTitle.textContent = config.messages.reportSubmitted;
        }
        if (modalText && config.messages.reportSubmittedDesc) {
            modalText.textContent = config.messages.reportSubmittedDesc;
        }
        successModal.classList.remove('hidden');
    }
    
    // Render updated reports
    renderReports();
    
    // Stats already updated above, but update again to ensure consistency
    updateStats();
    
    console.log('Total reports after submission:', reports.length);
}

function resetForm() {
    currentImage = null;
    currentLocation = null;
    // Note: We keep userLocation so it can be used for routing to other reports
    imageInput.value = '';
    if (cameraInput) cameraInput.value = '';
    description.value = '';
    imagePreview.classList.add('hidden');
    uploadLabel.style.display = 'flex';
    locationInfo.classList.add('hidden');
    locationStatus.classList.add('hidden');
    mapLinkContainer.classList.add('hidden');
    if (municipalInfo) municipalInfo.classList.add('hidden');
    if (locationDisplay) locationDisplay.classList.remove('hidden');
    if (locationEdit) locationEdit.classList.add('hidden');
    if (manualLatitude) manualLatitude.value = '';
    if (manualLongitude) manualLongitude.value = '';
    // Camera button doesn't need reset since it always opens native camera
    submitBtn.disabled = true;
}

// Reports Rendering
function renderReports(filter = 'all') {
    const filteredReports = filter === 'all' 
        ? reports 
        : reports.filter(report => report.status === filter);
    
    if (filteredReports.length === 0) {
        const emptyMessage = filter === 'all' 
            ? (config.messages.noReports || 'No reports yet. Be the first to help keep our planet clean!')
            : (config.messages.noReportsFiltered || 'No reports found. Try selecting a different filter.');
        reportsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🌿</div>
                <p>${emptyMessage}</p>
            </div>
        `;
        return;
    }
    
    reportsList.innerHTML = filteredReports.map(report => createReportCard(report)).join('');
    
    // Add status update buttons for demo purposes
    addStatusUpdateButtons();
}

function createReportCard(report) {
    const statusLabels = config.status.labels || {
        'reported': 'Reported',
        'in-progress': 'In Progress',
        'resolved': 'Resolved'
    };
    
    const statusIcons = config.status.icons || {
        'reported': '⚠️',
        'in-progress': '🔄',
        'resolved': '✅'
    };
    
    const date = new Date(report.date);
    const dateFormat = config.dateFormat || { locale: 'en-US', options: {} };
    const formattedDate = date.toLocaleDateString(dateFormat.locale, dateFormat.options);
    
    const zoom = config.map.mapZoom || 18;
    const mapUrl = `${config.map.openstreetmapBaseUrl}/?mlat=${report.latitude}&mlon=${report.longitude}&zoom=${zoom}`;
    
    return `
        <div class="report-card status-${report.status}" data-id="${report.id}">
            <img src="${report.image}" alt="Garbage location" class="report-image">
            <div class="report-details">
                <div class="report-status ${report.status}">
                    <span>${statusIcons[report.status]}</span>
                    <span>${statusLabels[report.status]}</span>
                </div>
                <p class="report-description">${escapeHtml(report.description)}</p>
                <div class="report-location">
                    <span>📍</span>
                    <span>${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}</span>
                </div>
                <div class="map-actions">
                    <a href="${mapUrl}" target="_blank" class="map-link">
                        <span>🗺️</span>
                        <span>View on Map</span>
                        <span>↗</span>
                    </a>
                    <button onclick="getRouteToNearestMunicipal(${report.latitude}, ${report.longitude})" class="btn btn-primary" style="font-size: 0.9rem; padding: 0.5rem 1rem;">
                        <span>🧭</span>
                        Get Route
                    </button>
                </div>
                <div class="report-date">Reported on ${formattedDate}</div>
                <div class="status-controls" style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${report.status !== 'reported' ? `<button class="btn btn-primary" onclick="updateStatus('${report.id}', 'reported')" style="font-size: 0.8rem; padding: 0.5rem 1rem;">Set to Reported</button>` : ''}
                    ${report.status !== 'in-progress' ? `<button class="btn btn-primary" onclick="updateStatus('${report.id}', 'in-progress')" style="font-size: 0.8rem; padding: 0.5rem 1rem;">Set to In Progress</button>` : ''}
                    ${report.status !== 'resolved' ? `<button class="btn btn-primary" onclick="updateStatus('${report.id}', 'resolved')" style="font-size: 0.8rem; padding: 0.5rem 1rem;">Set to Resolved</button>` : ''}
                    <button class="btn" onclick="deleteReport('${report.id}')" style="font-size: 0.8rem; padding: 0.5rem 1rem; background: var(--danger-color); color: white; border: none;">
                        <span>🗑️</span>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Status Update
function updateStatus(reportId, newStatus) {
    const report = reports.find(r => r.id === reportId);
    if (report) {
        // Store old status before updating
        const oldStatus = report.status;
        
        // Only update if status is actually changing
        if (oldStatus === newStatus) {
            return;
        }
        
        // Update the report status
        report.status = newStatus;
        localStorage.setItem(config.storage.reportsKey, JSON.stringify(reports));
        
        // Update stats IMMEDIATELY before re-rendering
        updateStats();
        
        // Get current filter and re-render reports
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.status || 'all';
        renderReports(activeFilter);
        
        console.log('Status changed:', { reportId, oldStatus, newStatus });
    }
}

// Delete Report
function deleteReport(reportId) {
    if (confirm(config.messages.confirmDelete || 'Are you sure you want to delete this report? This action cannot be undone.')) {
        reports = reports.filter(r => r.id !== reportId);
        localStorage.setItem(config.storage.reportsKey, JSON.stringify(reports));
        
        // Get current filter
        const activeFilter = document.querySelector('.filter-btn.active').dataset.status;
        renderReports(activeFilter);
        updateStats();
    }
}

// Filter Functions
function handleFilterClick(btn) {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.status;
    renderReports(filter);
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Routing Functions
function getRouteToLocation(destLat, destLon) {
    if (!userLocation) {
        // If user location not available, prompt to get it first
        if (confirm(config.messages.locationNeeded || 'Your location is needed for routing. Get your location now?')) {
            getCurrentLocation(() => {
                // After getting location, open route
                openRoute(destLat, destLon);
            });
        }
        return;
    }
    openRoute(destLat, destLon);
}

function openRoute(destLat, destLon) {
    if (!userLocation) {
        alert(config.messages.getLocationFirst || 'Please get your location first to view routes.');
        return;
    }
    
    // Use Google Maps for routing (most reliable and widely used)
    // Format: https://www.google.com/maps/dir/START_LAT,START_LON/END_LAT,END_LON
    const googleMapsUrl = `${config.map.googleMapsBaseUrl}/dir/${userLocation.lat},${userLocation.lon}/${destLat},${destLon}`;
    
    // Alternative: GraphHopper (open source routing)
    const graphhopperUrl = `${config.map.graphhopperUrl}/?point=${userLocation.lat},${userLocation.lon}&point=${destLat},${destLon}`;
    
    // Open Google Maps route (most users are familiar with it)
    window.open(googleMapsUrl, '_blank');
}

// Route to nearest municipal authority from a given point
function getRouteToNearestMunicipal(sourceLat, sourceLon) {
    const ensureUserLocationAndRoute = () => {
        if (!userLocation) {
            alert(config.messages.getLocationFirst || 'Please get your location first to view routes.');
            return;
        }
        // Find office near the reported location (sourceLat, sourceLon)
        findNearestMunicipalOfficeCoords(sourceLat, sourceLon)
            .then((office) => {
                if (!office) {
                    alert('Could not find a nearby municipal office.');
                    return;
                }
                const googleMapsUrl = `${config.map.googleMapsBaseUrl}/dir/${userLocation.lat},${userLocation.lon}/${office.lat},${office.lon}`;
                window.open(googleMapsUrl, '_blank');
            })
            .catch(() => {
                alert('Unable to get directions to the municipal office right now.');
            });
    };

    if (!userLocation) {
        // Prompt to get user's location first, then continue
        if (confirm(config.messages.locationNeeded || 'Your location is needed for routing. Get your location now?')) {
            getCurrentLocation(() => {
                ensureUserLocationAndRoute();
            });
        }
        return;
    }
    ensureUserLocationAndRoute();
}

// Lightweight lookup for nearest municipal office (coords only)
async function findNearestMunicipalOfficeCoords(lat, lon) {
    try {
        // Reverse geocode to determine city/municipality context
        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
        const reverseRes = await fetch(reverseUrl, { headers: { 'User-Agent': 'EcoSphere-Waste-Management/1.0' } });
        if (!reverseRes.ok) return null;
        const reverseData = await reverseRes.json();
        const address = reverseData?.address || {};
        const city = address.city || address.town || address.village || address.municipality || '';

        const searchTerms = [
            `${city} municipal corporation`,
            `${city} municipal office`,
            `${city} city corporation`,
            `${city} municipality`,
            `municipal corporation ${city}`
        ];

        let best = null;
        for (const term of searchTerms) {
            const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=5&addressdetails=0`;
            const res = await fetch(searchUrl, { headers: { 'User-Agent': 'EcoSphere-Waste-Management/1.0' } });
            if (!res.ok) continue;
            const items = await res.json();
            if (!items || items.length === 0) continue;
            // pick closest
            let closest = items[0];
            let minDist = calculateDistance(lat, lon, parseFloat(closest.lat), parseFloat(closest.lon));
            for (const it of items) {
                const d = calculateDistance(lat, lon, parseFloat(it.lat), parseFloat(it.lon));
                if (d < minDist) { minDist = d; closest = it; }
            }
            best = { lat: parseFloat(closest.lat), lon: parseFloat(closest.lon), name: closest.display_name };
            break;
        }
        return best;
    } catch (_) {
        return null;
    }
}

// Make functions globally available for inline handlers
window.removeImage = removeImage;
window.updateStatus = updateStatus;
window.getRouteToLocation = getRouteToLocation;
window.getRouteToNearestMunicipal = getRouteToNearestMunicipal;
window.deleteReport = deleteReport;
// capturePhoto removed - using native camera directly

