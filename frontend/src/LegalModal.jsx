import './LegalModal.css';

function LegalModal({ type, onClose }) {
    let content = null;
    let title = '';

    if (type === 'privacy') {
        title = 'Privacy Policy';
        content = (
            <div className="legal-content-text">
                <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
                <p>At PlacementBabai, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our job discovery platform.</p>

                <h3>Information Collection</h3>
                <p>We collect information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and services. For job seekers, this may include resume details, while for employers, this includes company contact information.</p>

                <h3>How We Use Your Information</h3>
                <p>We use the information we collect or receive to communicate with you, to provide you with the services you request (like matching you with jobs), and to improve our website experience.</p>

                <h3>Data Security</h3>
                <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.</p>
            </div>
        );
    } else if (type === 'terms') {
        title = 'Terms of Service';
        content = (
            <div className="legal-content-text">
                <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
                <p>These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), and PlacementBabai, concerning your access to and use of the website.</p>

                <h3>User Representations</h3>
                <p>By using the Site, you represent and warrant that: all registration information you submit will be true, accurate, current, and complete, and you will maintain the accuracy of such information.</p>

                <h3>Prohibited Activities</h3>
                <p>You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>
            </div>
        );
    } else if (type === 'contact') {
        title = 'Contact Us';
        content = (
            <div className="legal-content-text">
                <p>We would love to hear from you! If you have any questions, feedback, or need assistance, please reach out to us using the details below.</p>

                <div className="contact-details" style={{ marginTop: '2rem', padding: '1.5rem', background: '#e8f5ff', borderRadius: '8px' }}>
                    <p><strong>📧 Email:</strong> support@placementbabai.com</p>
                    <p><strong>📞 Phone:</strong> +91 98765 43210</p>
                    <p><strong>📍 Address:</strong> Block C, Tech Park, Hyderabad, India</p>
                </div>
            </div>
        );
    }

    return (
        <div className="legal-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="legal-modal">
                <button className="legal-close" onClick={onClose} aria-label="Close">✕</button>
                <div className="legal-header">
                    <h2>{title}</h2>
                </div>
                <div className="legal-body">
                    {content}
                </div>
            </div>
        </div>
    );
}

export default LegalModal;
