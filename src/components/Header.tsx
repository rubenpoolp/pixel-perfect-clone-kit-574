import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { user, signOut } = useAuth();

  return (
    <header className={`bg-[rgba(252,251,248,0.75)] backdrop-blur-sm sticky top-0 z-50 flex w-full flex-col items-center py-4 px-6 sm:py-6 sm:px-[70px] max-md:max-w-full ${className}`}>
      <div className="flex w-full max-w-[1200px] gap-5 flex-wrap justify-between items-center max-md:max-w-full">
        <Link to="/">
          <img 
            src="/lovable-uploads/c22e00c0-8844-4c75-9061-80d10b4cb779.png" 
            alt="Jackie Logo" 
            className="h-8 sm:h-10 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-[rgba(28,28,28,0.7)] hidden sm:inline">
                {user.email}
              </span>
              <button 
                onClick={signOut}
                className="bg-[rgba(28,28,28,1)] flex flex-col items-stretch text-sm sm:text-lg text-[rgba(252,251,248,1)] font-medium text-center leading-none justify-center px-4 py-2 sm:px-8 sm:py-[11px] rounded-md hover:bg-[rgba(28,28,28,0.9)] transition-colors min-h-[40px] sm:min-h-auto"
              >
                <div>Sign Out</div>
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/auth"
                className="bg-[rgba(28,28,28,1)] flex flex-col items-stretch text-sm sm:text-lg text-[rgba(252,251,248,1)] font-medium text-center leading-none justify-center px-4 py-2 sm:px-8 sm:py-[11px] rounded-md hover:bg-[rgba(28,28,28,0.9)] transition-colors min-h-[40px] sm:min-h-auto"
              >
                <div>Sign In</div>
              </Link>
              <button 
                onClick={() => window.open('https://calendly.com/ruben-friendsofjackie/30min', '_blank')} 
                className="bg-transparent border border-[rgba(28,28,28,1)] flex flex-col items-stretch text-sm sm:text-lg text-[rgba(28,28,28,1)] font-medium text-center leading-none justify-center px-4 py-2 sm:px-8 sm:py-[11px] rounded-md hover:bg-[rgba(28,28,28,0.1)] transition-colors min-h-[40px] sm:min-h-auto"
              >
                <div>Request a demo</div>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
