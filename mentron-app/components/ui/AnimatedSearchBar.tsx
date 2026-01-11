'use client';

import styles from './AnimatedSearch.module.css';

interface AnimatedSearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    placeholder?: string;
}

export function AnimatedSearchBar({ value, onChange, onFocus, placeholder = 'Search...' }: AnimatedSearchBarProps) {
    return (
        <div className={styles.searchContainer}>
            <div className={styles.glow}></div>
            <div className={styles.darkBorderBg}></div>
            <div className={styles.darkBorderBg}></div>
            <div className={styles.darkBorderBg}></div>
            <div className={styles.white}></div>
            <div className={styles.border}></div>

            <div className={styles.main}>
                <input
                    placeholder={placeholder}
                    type="text"
                    className={styles.input}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={onFocus}
                />
                <div className={styles.pinkMask}></div>
                <div className={styles.searchIcon}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        height="20"
                        fill="none"
                    >
                        <circle stroke="url(#searchGrad)" r="8" cy="11" cx="11"></circle>
                        <line
                            stroke="url(#searchLine)"
                            y2="16.65"
                            y1="22"
                            x2="16.65"
                            x1="22"
                        ></line>
                        <defs>
                            <linearGradient gradientTransform="rotate(50)" id="searchGrad">
                                <stop stopColor="#f8e7f8" offset="0%"></stop>
                                <stop stopColor="#b6a9b7" offset="50%"></stop>
                            </linearGradient>
                            <linearGradient id="searchLine">
                                <stop stopColor="#b6a9b7" offset="0%"></stop>
                                <stop stopColor="#837484" offset="50%"></stop>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>
        </div>
    );
}
