import React from 'react';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header className={`bg-[rgba(252,251,248,0.75)] backdrop-blur-sm sticky top-0 z-50 flex w-full flex-col items-center py-6 px-[70px] max-md:max-w-full max-md:px-5 ${className}`}>
      <div className="flex w-full max-w-[1200px] gap-5 flex-wrap justify-between items-center max-md:max-w-full">
        <img 
          src="/lovable-uploads/c22e00c0-8844-4c75-9061-80d10b4cb779.png" 
          alt="Jackie Logo" 
          className="h-16 w-auto object-contain"
        />
        <button onClick={() => window.open('https://calendly.com/ruben-friendsofjackie/30min', '_blank')} className="bg-[rgba(28,28,28,1)] flex flex-col items-stretch text-lg text-[rgba(252,251,248,1)] font-medium text-center leading-none justify-center px-8 py-[11px] rounded-md max-md:px-5 hover:bg-[rgba(28,28,28,0.9)] transition-colors">
          <div>Request a demo</div>
        </button>
      </div>
    </header>
  );
};
