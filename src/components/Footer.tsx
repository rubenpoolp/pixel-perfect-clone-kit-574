import React from 'react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const footerLinks = [
    { text: 'Privacy', href: '/privacy' },
    { text: 'LinkedIn', href: 'https://linkedin.com' }
  ];

  return (
    <footer className={`bg-[rgba(252,251,248,1)] self-stretch flex w-full flex-col mt-[189px] pl-8 pr-20 pt-[20px] pb-[40px] rounded-[20px] border-[rgba(247,244,237,1)] border-solid border-2 max-md:max-w-full max-md:mt-10 max-md:pb-[30px] max-md:px-5 ${className}`}>
      <nav className="mt-[20px] max-md:mt-5 flex justify-center gap-8">
        {footerLinks.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="text-[rgba(28,28,28,1)] text-base font-medium hover:text-[rgba(28,28,28,0.8)] transition-colors"
          >
            {link.text}
          </a>
        ))}
      </nav>
    </footer>
  );
};
