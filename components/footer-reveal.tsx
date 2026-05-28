import React from "react";

interface FooterRevealProps {
  children: React.ReactNode;
  /**
   * The height of the reveal area. 
   * This should be large enough to show your footer content.
   */
  height?: string;
  className?: string;
}

/**
 * FooterReveal
 * 
 * A pure CSS implementation of the "uncover" effect.
 * The footer is sticky at the bottom with a lower z-index,
 * while the main content scrolls over it with a solid background.
 */
export function FooterReveal({ 
  children, 
  height = "min-h-[400px]", 
  className = "" 
}: FooterRevealProps) {
  return (
    <footer 
      className={`sticky bottom-0 -z-10 w-full overflow-hidden ${height} ${className}`}
    >
      {children}
    </footer>
  );
}
