import { useEffect, useState, useRef } from 'react';
import { generateLiquidGlassAssets } from '../utils/liquidGlassGenerator';

const LiquidGlassFilter = ({ id, targetRef, options = {} }) => {
  const [assets, setAssets] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!targetRef?.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      
      const el = targetRef.current;
      if (!el) return;
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setDimensions({ width, height });
        const newAssets = generateLiquidGlassAssets(width, height, options);
        setAssets(newAssets);
      }, 50); // debounce resize
    });

    observer.observe(targetRef.current);
    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [targetRef, options]);

  if (!assets || dimensions.width === 0 || dimensions.height === 0) return null;

  return (
    <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
      <defs>
        <filter
          id={id}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={options.blur || 0.5}
            result="blurred"
          />
          <feImage
            href={assets.displacementUrl}
            x="0"
            y="0"
            width={dimensions.width}
            height={dimensions.height}
            result="displacement_map"
            preserveAspectRatio="none"
          />
          <feDisplacementMap
            in="blurred"
            in2="displacement_map"
            scale={(assets.maximumDisplacement || 1) * (options.refractionScale || 1.5)}
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feColorMatrix
            in="displaced"
            type="saturate"
            values="1.3"
            result="displaced_saturated"
          />
          <feImage
            href={assets.specularUrl}
            x="0"
            y="0"
            width={dimensions.width}
            height={dimensions.height}
            result="specular_layer"
            preserveAspectRatio="none"
          />
          <feComponentTransfer in="specular_layer" result="specular_faded">
            <feFuncA type="linear" slope={options.specularOpacity || 1} />
          </feComponentTransfer>
          <feBlend in="specular_faded" in2="displaced_saturated" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
};

export default LiquidGlassFilter;
