// License Management System for QuickMark PDF Premium
// Handles $3.99 lifetime purchase verification and storage

class LicenseManager {
    constructor() {
        this.isPremium = false;
        this.init();
    }

    async init() {
        // Load premium status from storage
        const result = await chrome.storage.local.get('isPremium');
        this.isPremium = result.isPremium || false;
    }

    async checkPremiumStatus() {
        const result = await chrome.storage.local.get('isPremium');
        this.isPremium = result.isPremium || false;
        return this.isPremium;
    }

    async activatePremium(licenseKey = null) {
        // Simple activation - in production, verify license key with backend
        if (licenseKey) {
            // Validate license key format (simple check for demo)
            const isValid = this.validateLicenseKey(licenseKey);
            if (!isValid) {
                throw new Error('Invalid license key');
            }
        }

        await chrome.storage.local.set({
            isPremium: true,
            activatedAt: new Date().toISOString(),
            licenseKey: licenseKey
        });
        this.isPremium = true;
        return true;
    }

    validateLicenseKey(key) {
        // Simple validation - checks format: QMPDF-XXXXX-XXXXX-XXXXX
        const pattern = /^QMPDF-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
        return pattern.test(key);
    }

    async deactivatePremium() {
        // For testing/development purposes
        await chrome.storage.local.set({ isPremium: false });
        this.isPremium = false;
    }

    generateTrialKey() {
        // Generate a sample license key for testing
        const segment = () => Math.random().toString(36).substring(2, 7).toUpperCase();
        return `QMPDF-${segment()}-${segment()}-${segment()}`;
    }

    async hasFeatureAccess(featureName) {
        await this.checkPremiumStatus();

        const premiumFeatures = [
            'highlight',
            'draw',
            'shapes',
            'notes',
            'text-decoration'
        ];

        if (premiumFeatures.includes(featureName)) {
            return this.isPremium;
        }

        // Free features are always accessible
        return true;
    }

    showUpgradeModal() {
        const modal = document.getElementById('upgrade-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideUpgradeModal() {
        const modal = document.getElementById('upgrade-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Global instance
const licenseManager = new LicenseManager();
