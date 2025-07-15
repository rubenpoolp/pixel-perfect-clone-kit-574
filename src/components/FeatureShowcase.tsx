import React from 'react';

interface FeatureShowcaseProps {
  className?: string;
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ className = '' }) => {
  return (
    <section className={`w-full max-w-[1504px] ${className}`}>
      <h2 className="text-[rgba(28,28,28,1)] text-5xl font-medium leading-none tracking-[-1.2px] mt-[180px] max-md:max-w-full max-md:text-[40px] max-md:mt-10">
        From questions to improvement — in seconds
      </h2>
      <p className="text-[#1c1c1c] text-xl font-normal leading-none mt-[22px] max-md:max-w-full">
        Ask Clutch anything — get an insight, a visual, and an actionable next step. No more guessing.
      </p>
      
      <div className="border w-[1473px] shrink-0 max-w-full h-[3px] mt-[33px] border-[rgba(206,206,206,1)] border-solid" />
      
      <div className="w-full max-w-[1467px] mt-[38px] max-md:max-w-full">
        <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
          <div className="w-[42%] max-md:w-full max-md:ml-0">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/6990335c6fc47696e4de9dd656f34cafd1a18d57?placeholderIfAbsent=true"
              className="aspect-[1.44] object-contain w-full grow rounded-[11px] max-md:max-w-full max-md:mt-10"
              alt="Feature showcase left"
            />
          </div>
          <div className="w-[17%] ml-5 max-md:w-full max-md:ml-0">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/a686228dfdb2d6a53522a2f780257fedba21e222?placeholderIfAbsent=true"
              className="aspect-[3.76] object-contain w-[218px] shrink-0 max-w-full self-stretch my-auto max-md:mt-10"
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
