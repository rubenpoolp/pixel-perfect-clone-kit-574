import React from 'react';

interface BenefitProps {
  emoji: string;
  title: string;
}

const Benefit: React.FC<BenefitProps> = ({ emoji, title }) => {
  return (
    <div className="w-[33%] max-md:w-full max-md:ml-0">
      <div className="flex grow flex-col items-stretch font-normal text-center max-md:mt-10">
        <div className="text-black text-xl sm:text-2xl lg:text-3xl leading-tight self-center">
          {emoji}
        </div>
        <div className="text-[#1c1c1c] text-base sm:text-lg lg:text-xl leading-6 sm:leading-7 mt-8 sm:mt-10 lg:mt-14">
          {title}
        </div>
      </div>
    </div>
  );
};

interface BenefitsProps {
  className?: string;
}

export const Benefits: React.FC<BenefitsProps> = ({ className = '' }) => {
  const benefits = [
    {
      emoji: '🔍',
      title: 'Understand by chatting what\'s really happening in your product'
    },
    {
      emoji: '🧠',
      title: 'Let AI surface problems and propose smart experiments'
    },
    {
      emoji: '⚡️',
      title: 'Ship A/B tests or UI fixes instantly — without writing code'
    }
  ];

  return (
    <section className={`w-full max-w-[1504px] px-4 sm:px-8 ${className}`}>
      <h2 className="text-[rgba(28,28,28,1)] text-xl sm:text-2xl lg:text-3xl font-medium leading-tight tracking-[-0.8px] sm:tracking-[-1.2px] mt-12 sm:mt-16 lg:mt-[69px]">
        3 key benefits
      </h2>
      
      <div className="border w-full max-w-[1473px] shrink-0 h-[2px] sm:h-[3px] mt-6 sm:mt-8 lg:mt-[29px] border-[rgba(206,206,206,1)] border-solid" />
      
      <div className="self-center w-full max-w-[1362px] mt-12 sm:mt-16 lg:mt-20 max-md:max-w-full">
        <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
          {benefits.map((benefit, index) => (
            <div key={index} className="contents">
              <Benefit emoji={benefit.emoji} title={benefit.title} />
              {index < benefits.length - 1 && (
                <div className="ml-5 max-md:ml-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
