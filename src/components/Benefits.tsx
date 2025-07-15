import React from 'react';

interface BenefitProps {
  emoji: string;
  title: string;
}

const Benefit: React.FC<BenefitProps> = ({ emoji, title }) => {
  return (
    <div className="w-[33%] max-md:w-full max-md:ml-0">
      <div className="flex grow flex-col items-stretch font-normal text-center max-md:mt-10">
        <div className="text-black text-3xl leading-none self-center max-md:text-2xl">
          {emoji}
        </div>
        <div className="text-[#1c1c1c] text-xl leading-7 mt-14 max-md:mt-10">
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
    <section className={`w-full max-w-[1504px] ${className}`}>
      <h2 className="text-[rgba(28,28,28,1)] text-3xl font-medium leading-none tracking-[-1.2px] mt-[69px] max-md:text-2xl max-md:mt-10">
        3 key benefits
      </h2>
      
      <div className="border w-[1473px] shrink-0 max-w-full h-[3px] mt-[29px] border-[rgba(206,206,206,1)] border-solid" />
      
      <div className="self-center w-full max-w-[1362px] mt-20 max-md:max-w-full max-md:mt-10">
        <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
          {benefits.map((benefit, index) => (
            <React.Fragment key={index}>
              <Benefit emoji={benefit.emoji} title={benefit.title} />
              {index < benefits.length - 1 && (
                <div className="ml-5 max-md:ml-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
