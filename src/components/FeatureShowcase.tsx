import React from 'react';

interface FeatureShowcaseProps {
  className?: string;
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ className = '' }) => {
  return (
    <section className={`w-full max-w-[1504px] px-4 sm:px-8 ${className}`}>
      <h2 className="text-[rgba(28,28,28,1)] text-xl sm:text-2xl lg:text-3xl font-medium leading-tight tracking-[-0.8px] sm:tracking-[-1.2px] mt-16 sm:mt-24 lg:mt-[180px] max-md:max-w-full">
        From questions to improvement — in seconds
      </h2>
      <p className="text-[#1c1c1c] text-base sm:text-lg font-normal leading-relaxed mt-4 sm:mt-6 lg:mt-[22px] max-md:max-w-full">
        No more guessing. Ask Jackie anything — get an insight, a visual, and an actionable next step.
      </p>
      
      <div className="border w-full max-w-[1473px] shrink-0 h-[2px] sm:h-[3px] mt-6 sm:mt-8 lg:mt-[33px] border-[rgba(206,206,206,1)] border-solid" />
      
      <div className="w-full max-w-[1467px] mt-6 sm:mt-8 lg:mt-[38px] max-md:max-w-full">
        <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
          <div className="w-[42%] max-md:w-full max-md:ml-0">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/6990335c6fc47696e4de9dd656f34cafd1a18d57?placeholderIfAbsent=true"
              className="aspect-[1.44] object-contain w-full grow rounded-[11px] max-md:max-w-full max-md:mt-10"
              alt="Feature showcase left"
            />
          </div>
          <div className="w-[17%] ml-5 max-md:w-full max-md:ml-0 flex items-center justify-center">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/a686228dfdb2d6a53522a2f780257fedba21e222?placeholderIfAbsent=true"
              className="aspect-[3.76] object-contain w-full max-w-[218px] shrink-0 max-md:mt-10 max-md:rotate-90 max-md:w-12 max-md:aspect-[0.27] sm:w-32 md:w-36 lg:w-40"
              alt="Feature showcase center"
            />
          </div>
          <div className="w-[42%] ml-5 max-md:w-full max-md:ml-0">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/bdceaf7abb22c8a2ef4326994e502b0e3e16d134?placeholderIfAbsent=true"
              className="aspect-[1.44] object-contain w-full grow rounded-[11px] max-md:max-w-full max-md:mt-10"
              alt="Feature showcase right"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
