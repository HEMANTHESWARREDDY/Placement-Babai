import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './CustomSelect.css';

const CustomSelect = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);

    const openDropdown = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 6,
                left: rect.left,
                width: Math.max(rect.width, 160),
                zIndex: 99999,
            });
        }
        setIsOpen(prev => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                // Also check if click was inside the portal dropdown
                const portal = document.getElementById('custom-select-portal');
                if (portal && portal.contains(event.target)) return;
                setIsOpen(false);
            }
        };

        const handleScroll = () => setIsOpen(false);

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    const dropdownPortal = isOpen ? ReactDOM.createPortal(
        <div
            id="custom-select-portal"
            className="custom-select-options"
            style={dropdownStyle}
        >
            {options.map((option) => (
                <div
                    key={option.value}
                    className={`custom-option ${value === option.value ? 'selected' : ''}`}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(option.value); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleSelect(option.value); }}
                >
                    {option.label}
                </div>
            ))}
        </div>,
        document.body
    ) : null;

    return (
        <div
            className={`custom-select-container ${isOpen ? 'open' : ''} ${value ? 'active' : ''}`}
            ref={containerRef}
        >
            <div className="custom-select-trigger" onClick={openDropdown}>
                <span className="select-value">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className="select-arrow">▼</span>
            </div>
            {dropdownPortal}
        </div>
    );
};

export default CustomSelect;
