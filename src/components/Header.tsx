import React from 'react';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header className={`bg-[rgba(252,251,248,0.75)] flex w-full flex-col items-center pt-4 pb-[9px] px-[70px] max-md:max-w-full max-md:px-5 ${className}`}>
      <div className="flex w-full max-w-[1200px] gap-5 flex-wrap justify-between max-md:max-w-full">
        <div className="text-2xl text-black font-extrabold leading-[0.6]">
          <div className="w-[134px] shrink-0 h-1.5 border-black border-solid border-[6px] max-md:mr-0.5" />
          <div className="mt-[7px]">
            CLU CH
          </div>
        </div>
        <button onClick={() => window.open('https://your-typeform-link-here.com', '_blank')} className="bg-[rgba(28,28,28,1)] flex flex-col items-stretch text-lg text-[rgba(252,251,248,1)] font-medium text-center leading-none justify-center px-8 py-[11px] rounded-md max-md:px-5 hover:bg-[rgba(28,28,28,0.9)] transition-colors">
          <div>Request a demo</div>
        </button>
      </div>
    </header>
  );
};
