"use client";

import { useState } from 'react';
import { 
  Facebook, 
  Twitter, 
  Share2, 
  Link2,
  MessageCircle,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareButtonsProps {
  url: string;
  title?: string;
  description?: string;
  theme?: 'light' | 'dark';
  className?: string;
}

export default function ShareButtons({
  url,
  title,
  description,
  theme = 'light',
  className,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title || '');
    const encodedDescription = encodeURIComponent(description || '');

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`;
        break;
      case 'tumblr':
        shareUrl = `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodedUrl}&title=${encodedTitle}`;
        break;
      case 'blogger':
        shareUrl = `https://www.blogger.com/blog-this.g?u=${encodedUrl}&n=${encodedTitle}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}`;
        break;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || '',
          text: description || '',
          url: url,
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  const buttonClass = cn(
    "w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110",
    theme === 'dark' 
      ? "bg-slate-700 hover:bg-slate-600 text-white" 
      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Facebook */}
      <button
        onClick={() => handleShare('facebook')}
        className={cn(buttonClass, "bg-[#1877F2] hover:bg-[#166FE5] text-white")}
        title="Share on Facebook"
      >
        <Facebook className="w-5 h-5" />
      </button>

      {/* Twitter */}
      <button
        onClick={() => handleShare('twitter')}
        className={cn(buttonClass, "bg-[#1DA1F2] hover:bg-[#1A91DA] text-white")}
        title="Share on Twitter"
      >
        <Twitter className="w-5 h-5" />
      </button>

      {/* WhatsApp */}
      <button
        onClick={() => handleShare('whatsapp')}
        className={cn(buttonClass, "bg-[#25D366] hover:bg-[#20BA5A] text-white")}
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Reddit */}
      <button
        onClick={() => handleShare('reddit')}
        className={cn(buttonClass, "bg-[#FF4500] hover:bg-[#E03D00] text-white")}
        title="Share on Reddit"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      </button>

      {/* LinkedIn */}
      <button
        onClick={() => handleShare('linkedin')}
        className={cn(buttonClass, "bg-[#0077B5] hover:bg-[#006399] text-white")}
        title="Share on LinkedIn"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.069-.926-2.069-2.065 0-1.138.925-2.067 2.069-2.067 1.143 0 2.068.929 2.068 2.067 0 1.139-.925 2.065-2.068 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </button>

      {/* Pinterest */}
      <button
        onClick={() => handleShare('pinterest')}
        className={cn(buttonClass, "bg-[#BD081C] hover:bg-[#A30718] text-white")}
        title="Share on Pinterest"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.372 0 12s5.373 12 12 12c5.302 0 9.917-3.158 11.877-7.71-.163-.687-.74-3.61-.74-3.61s.19.38.74 1.644c.405 1.74.608 3.15.608 4.54 0 2.577-1.5 4.835-1.5 4.835s1.5-2.258 1.5-4.835c0-2.258-1.5-4.835-1.5-4.835s.75-2.258.75-4.835c0-2.577-1.5-4.835-1.5-4.835s1.5 2.258 1.5 4.835c0 2.258-.75 4.835-.75 4.835s-.75-2.258-.75-4.835c0-2.577 1.5-4.835 1.5-4.835s-1.5 2.258-1.5 4.835c0 2.258.75 4.835.75 4.835s-.75 2.258-.75 4.835c0 2.577 1.5 4.835 1.5 4.835z"/>
        </svg>
      </button>

      {/* Tumblr */}
      <button
        onClick={() => handleShare('tumblr')}
        className={cn(buttonClass, "bg-[#36465D] hover:bg-[#2D3A4E] text-white")}
        title="Share on Tumblr"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.23H6.03V6.789c1.521-.624 2.035-2.25 2.035-3.756 0-3.033-1.52-4.115-1.52-4.115C7.329.357 9.224 0 9.22 0h3.713v9.23h4.78v3.45h-4.78v7.608c0 1.479.373 2.466 1.688 2.466 1.566 0 2.75-1.104 2.75-2.605v-7.469h4.797V9.23h-4.797V0h4.797v3.45h-2.873v3.329h2.873v3.45h-2.752l-.031 7.608C19.563 21.565 15.813 24 14.563 24"/>
        </svg>
      </button>

      {/* Blogger */}
      <button
        onClick={() => handleShare('blogger')}
        className={cn(buttonClass, "bg-[#FF5722] hover:bg-[#E64A19] text-white")}
        title="Share on Blogger"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.976 24H2.026C.9 24 0 23.1 0 21.976V2.026C0 .9.9 0 2.026 0h19.95C23.1 0 24 .9 24 2.026v19.95C24 23.1 23.1 24 21.976 24zM8.952 4.622c-1.925 0-3.525 1.6-3.525 3.525v7.706c0 1.925 1.6 3.525 3.525 3.525h6.096c1.925 0 3.525-1.6 3.525-3.525V8.147c0-1.925-1.6-3.525-3.525-3.525H8.952zm.15 2.85h5.796c.75 0 1.35.6 1.35 1.35s-.6 1.35-1.35 1.35H9.102c-.75 0-1.35-.6-1.35-1.35s.6-1.35 1.35-1.35zm0 5.4h5.796c.75 0 1.35.6 1.35 1.35s-.6 1.35-1.35 1.35H9.102c-.75 0-1.35-.6-1.35-1.35s.6-1.35 1.35-1.35z"/>
        </svg>
      </button>

      {/* Email */}
      <button
        onClick={() => handleShare('email')}
        className={cn(buttonClass, theme === 'dark' ? "bg-slate-600 hover:bg-slate-500" : "bg-gray-200 hover:bg-gray-300")}
        title="Share via Email"
      >
        <Mail className="w-5 h-5" />
      </button>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className={cn(buttonClass, copied ? "bg-green-500 hover:bg-green-600" : theme === 'dark' ? "bg-slate-600 hover:bg-slate-500" : "bg-gray-200 hover:bg-gray-300")}
        title="Copy Link"
      >
        {copied ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <Link2 className="w-5 h-5" />
        )}
      </button>

      {/* Native Share (mobile) */}
      {navigator.share && (
        <button
          onClick={handleNativeShare}
          className={cn(buttonClass, theme === 'dark' ? "bg-slate-600 hover:bg-slate-500" : "bg-gray-200 hover:bg-gray-300")}
          title="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

