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
    <footer className={`bg-[rgba(252,251,248,1)] self-stretch flex w-full flex-col mt-[189px] pl-8 pr-20 pt-[35px] pb-[139px] rounded-[20px] border-[rgba(247,244,237,1)] border-solid border-2 max-md:max-w-full max-md:mt-10 max-md:pb-[100px] max-md:px-5 ${className}`}>
      <div className="self-stretch flex w-full max-w-[1200px] gap-5 flex-wrap justify-between max-md:max-w-full">
        <div className="text-2xl text-black font-extrabold leading-[0.6]">
          <div className="w-[134px] shrink-0 h-1.5 border-black border-solid border-[6px] max-md:mr-0.5" />
          <div className="mt-[7px]">
            CLU CH
          </div>
        </div>
        <button onClick={() => window.open('https://calendly.com/ruben-friendsofjackie/30min', '_blank')} className="bg-[rgba(28,28,28,1)] flex flex-col items-stretch text-lg text-[rgba(252,251,248,1)] font-medium text-center leading-none justify-center mt-[5px] px-8 py-[11px] rounded-md max-md:px-5 hover:bg-[rgba(28,28,28,0.9)] transition-colors">
          <div>Request a demo</div>
        </button>
      </div>
      
      <nav className="mt-[68px] max-md:mt-10">
        {footerLinks.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="text-[rgba(28,28,28,1)] text-base font-medium ml-2.5 block hover:text-[rgba(28,28,28,0.8)] transition-colors"
            style={{ marginTop: index === 0 ? '0' : '18px', marginBottom: index === footerLinks.length - 1 ? '-28px' : '0' }}
          >
            {link.text}
          </a>
        ))}
      </nav>
    </footer>
  );
};
