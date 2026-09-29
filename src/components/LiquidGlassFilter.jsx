import { useEffect, useState, useRef } from 'react';
import { generateLiquidGlassAssets } from '../utils/liquidGlassGenerator';

const LiquidGlassFilter = ({ id, targetRef, options = {} }) => {
  const [assets, setAssets] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const timeoutRef = useRef(null);

  const optionsKey = JSON.stringify(options);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (!targetRef?.current) return;

    const el = targetRef.current;
    const initialWidth = el.offsetWidth;
    const initialHeight = el.offsetHeight;
    
    // Generate initial filter assets synchronously so they are active on the very first frame
    if (initialWidth > 0 && initialHeight > 0) {
      setDimensions({ width: initialWidth, height: initialHeight });
      const parsedOptions = JSON.parse(optionsKey);
      setAssets(generateLiquidGlassAssets(initialWidth, initialHeight, parsedOptions));
    }

    const lastGenDims = { width: initialWidth, height: initialHeight };

    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      
      // Skip the very first observer trigger since we already set the initial size synchronously
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      
      const width = el.offsetWidth;
      const height = el.offsetHeight;

      // Skip regeneration if dimensions haven't meaningfully changed (< 3px)
      if (Math.abs(width - lastGenDims.width) < 3 && Math.abs(height - lastGenDims.height) < 3) {
        return;
      }
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastGenDims.width = width;
        lastGenDims.height = height;
        setDimensions({ width, height });
        const parsedOptions = JSON.parse(optionsKey);
        const newAssets = generateLiquidGlassAssets(width, height, parsedOptions);
        setAssets(newAssets);
      }, 250); // 250ms debounce to avoid running heavy canvas updates during scale/height animations
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [targetRef, optionsKey]);

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
          <feGaussianBlur
            in="specular_layer"
            stdDeviation="1"
            result="specular_smooth"
          />
          <feComponentTransfer in="specular_smooth" result="specular_faded">
            <feFuncA type="linear" slope={options.specularOpacity || 0} />
          </feComponentTransfer>
          <feBlend in="specular_faded" in2="displaced_saturated" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
};

export default LiquidGlassFilter;
