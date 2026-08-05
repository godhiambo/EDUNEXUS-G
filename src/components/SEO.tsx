import React from 'react';
import SEOHead, { SEOHeadProps } from './SEOHead';

export interface SEOProps extends SEOHeadProps {
  canonicalPath?: string;
}

export const SEO: React.FC<SEOProps> = ({ canonicalPath, ...props }) => {
  return <SEOHead canonicalUrl={canonicalPath} {...props} />;
};

export default SEO;

