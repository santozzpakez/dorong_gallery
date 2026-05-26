import React from 'react';

/**
 * ProductImage - A secure wrapper component for product images.
 * Implements 3 layers of protection against casual asset theft:
 * 1. Uses a <div> with `background-image` instead of an `<img>` tag.
 * 2. Adds a transparent absolute overlay over the image area.
 * 3. Prevents context menu (right click) and drag-and-drop actions.
 * 
 * Supports responsive styling and overlays for zoom badges, sizes, etc.
 */
export default function ProductImage({
  src,
  alt = 'Product image',
  className = '',
  style = {},
  imgClassName = '',
  imgStyle = {},
  onClick,
  children,
  ...props
}) {
  // Prevent context menu (right click)
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  // Prevent drag-and-drop start
  const handleDragStart = (e) => {
    e.preventDefault();
  };

  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      style={{
        ...style,
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
      }}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onClick={onClick}
      {...props}
    >
      {/* Layer 1: Background image div */}
      {src ? (
        <div
          className={`w-full h-full ${imgClassName}`}
          style={{
            backgroundImage: `url(${JSON.stringify(src)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            WebkitUserDrag: 'none',
            ...imgStyle,
          }}
          role="img"
          aria-label={alt}
        />
      ) : (
        <div className="w-full h-full bg-zinc-850 dark:bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-500">
          No Image
        </div>
      )}

      {/* Layer 2: Transparent absolute overlay covering the entire image area */}
      <div 
        className="absolute inset-0 bg-transparent pointer-events-auto"
        style={{
          WebkitUserDrag: 'none',
          userSelect: 'none',
        }}
      />

      {/* Layer 3: Render custom interactive children (e.g. badges, zoom button) above overlay */}
      {children && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="relative w-full h-full pointer-events-auto">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
