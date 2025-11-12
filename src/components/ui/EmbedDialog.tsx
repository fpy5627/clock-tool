"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedUrl: string;
  theme?: 'light' | 'dark';
  title?: string;
}

const SIZE_PRESETS = [
  { label: 'Small', width: 320, height: 200 },
  { label: 'Medium', width: 475, height: 250 },
  { label: 'Large', width: 640, height: 360 },
  { label: 'Custom', width: 0, height: 0 },
];

export default function EmbedDialog({
  open,
  onOpenChange,
  embedUrl,
  theme = 'light',
  title = 'Embed',
}: EmbedDialogProps) {
  const [showButtons, setShowButtons] = useState(true);
  const [selectedSize, setSelectedSize] = useState(1); // Default to Medium
  const [customWidth, setCustomWidth] = useState(475);
  const [customHeight, setCustomHeight] = useState(250);
  const [copied, setCopied] = useState(false);
  const [iframeCode, setIframeCode] = useState('');

  useEffect(() => {
    const size = SIZE_PRESETS[selectedSize];
    const width = size.width || customWidth;
    const height = size.height || customHeight;
    
    const code = `<iframe width="${width}" height="${height}" src="${embedUrl}" frameborder="0" allowfullscreen${!showButtons ? ' style="pointer-events: none;"' : ''}></iframe>`;
    setIframeCode(code);
  }, [selectedSize, customWidth, customHeight, showButtons, embedUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  const currentSize = SIZE_PRESETS[selectedSize];
  const previewWidth = currentSize.width || customWidth;
  const previewHeight = currentSize.height || customHeight;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-[600px] max-h-[90vh] overflow-y-auto",
          theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
        )}
      >
        <DialogHeader>
          <DialogTitle className={cn(theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Show Buttons Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-buttons"
              checked={showButtons}
              onCheckedChange={(checked) => setShowButtons(checked === true)}
            />
            <Label
              htmlFor="show-buttons"
              className={cn(
                "text-sm font-medium cursor-pointer",
                theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
              )}
            >
              Show Buttons
            </Label>
          </div>

          {/* Size Selection */}
          <div className="space-y-2">
            <Label className={cn(theme === 'dark' ? 'text-slate-300' : 'text-gray-700')}>
              Size
            </Label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(Number(e.target.value))}
              className={cn(
                "w-full px-3 py-2 rounded-md border",
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              )}
            >
              {SIZE_PRESETS.map((preset, index) => (
                <option key={index} value={index}>
                  {preset.label} {preset.width > 0 && `(${preset.width} x ${preset.height})`}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Size Inputs */}
          {selectedSize === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(theme === 'dark' ? 'text-slate-300' : 'text-gray-700')}>
                  Width
                </Label>
                <Input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className={cn(
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-600 text-white' 
                      : 'bg-white border-gray-300'
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className={cn(theme === 'dark' ? 'text-slate-300' : 'text-gray-700')}>
                  Height
                </Label>
                <Input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className={cn(
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-600 text-white' 
                      : 'bg-white border-gray-300'
                  )}
                />
              </div>
            </div>
          )}

          {/* HTML Code */}
          <div className="space-y-2">
            <Label className={cn(theme === 'dark' ? 'text-slate-300' : 'text-gray-700')}>
              HTML Code
            </Label>
            <div className="relative">
              <textarea
                readOnly
                value={iframeCode}
                className={cn(
                  "w-full h-24 px-3 py-2 rounded-md border font-mono text-sm resize-none",
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-600 text-slate-200' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                )}
              />
              <Button
                onClick={handleCopy}
                size="sm"
                variant="outline"
                className={cn(
                  "absolute right-2 top-2",
                  theme === 'dark' 
                    ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className={cn(theme === 'dark' ? 'text-slate-300' : 'text-gray-700')}>
              Preview
            </Label>
            <div 
              className={cn(
                "border rounded-md overflow-hidden",
                theme === 'dark' ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-gray-50'
              )}
              style={{
                width: '100%',
                maxWidth: '100%',
                aspectRatio: `${previewWidth} / ${previewHeight}`,
              }}
            >
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                className="w-full h-full"
                style={{ minHeight: '200px' }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className={cn(
              theme === 'dark' 
                ? 'bg-slate-700 hover:bg-slate-600' 
                : 'bg-gray-200 hover:bg-gray-300'
            )}
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

