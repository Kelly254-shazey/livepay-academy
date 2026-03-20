/**
 * Glassmorphism Showcase Component
 * 
 * Demonstrates all available glassmorphism utilities and variants.
 */

export function GlassmorphismShowcase() {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-2xl font-bold text-text mb-6">Glassmorphism Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Glass */}
          <div className="glass rounded-xl p-6 min-h-32">
            <h3 className="font-semibold text-text mb-2">.glass</h3>
            <p className="text-sm text-muted">
              Standard blur (18px) with semi-transparent surface. Perfect for most overlay and floating elements.
            </p>
          </div>

          {/* Glass Small */}
          <div className="glass-sm rounded-xl p-6 min-h-32">
            <h3 className="font-semibold text-text mb-2">.glass-sm</h3>
            <p className="text-sm text-muted">
              Subtle blur (8px) with higher opacity. Use for tooltips, badges, and light overlays.
            </p>
          </div>

          {/* Glass Large */}
          <div className="glass-lg rounded-xl p-6 min-h-32">
            <h3 className="font-semibold text-text mb-2">.glass-lg</h3>
            <p className="text-sm text-muted">
              Strong blur (24px) with lower opacity. Use for modals, sidebars, and prominent overlays.
            </p>
          </div>

          {/* Glass Full */}
          <div className="glass-full rounded-xl p-6 min-h-32">
            <h3 className="font-semibold text-text mb-2">.glass-full</h3>
            <p className="text-sm text-muted">
              Maximum effect with blur + saturation. Use for hero sections and primary containers.
            </p>
          </div>

          {/* Glass Border */}
          <div className="glass-border rounded-xl p-6 min-h-32">
            <h3 className="font-semibold text-text mb-2">.glass-border</h3>
            <p className="text-sm text-muted">
              Higher border visibility. Use for cards, containers, and defined boundaries.
            </p>
          </div>

          {/* Glass Interactive */}
          <div className="glass-interactive rounded-xl p-6 min-h-32 cursor-pointer hover:shadow-glass">
            <h3 className="font-semibold text-text mb-2">.glass-interactive</h3>
            <p className="text-sm text-muted">
              With hover and active states. Use for buttons, links, and clickable elements.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-text mb-6">Practical Examples</h2>
        <div className="space-y-6">
          {/* Hover Effect Example */}
          <div className="glass-hover rounded-xl p-8">
            <h3 className="text-lg font-semibold text-text mb-3">
              .glass-hover - Hover to see effect
            </h3>
            <p className="text-muted">
              This element has scale and shadow animation on hover. Great for cards, buttons, and interactive containers.
            </p>
          </div>

          {/* Stacked Glass Layers */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Layered Glass Effect</h3>
            <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-accent/10 to-warning/10">
              {/* Background content */}
              <div className="absolute inset-0 flex items-center justify-center text-muted opacity-50">
                Background Content
              </div>

              {/* Glass overlay layers */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
                <div className="glass-full rounded-xl p-6 w-full max-w-sm text-center">
                  <h4 className="font-semibold text-text mb-2">Featured Card</h4>
                  <p className="text-sm text-muted">
                    Float glass elements over content with blur effect
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Color Variants */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-4">
              Tailwind Integration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="backdrop-blur-lg border border-stroke/40 rounded-xl p-6 bg-surface/80">
                <p className="text-sm text-muted">
                  <code className="text-xs bg-surface-muted px-2 py-1 rounded">
                    backdrop-blur-lg
                  </code>
                </p>
              </div>
              <div className="backdrop-blur-xl border border-stroke/40 rounded-xl p-6 bg-surface/80">
                <p className="text-sm text-muted">
                  <code className="text-xs bg-surface-muted px-2 py-1 rounded">
                    backdrop-blur-xl
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-text mb-6">Usage Guide</h2>
        <div className="glass rounded-xl p-6 space-y-4">
          <div>
            <h4 className="font-semibold text-text mb-2">Best Practices</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>Use <code className="bg-surface-muted px-1 rounded text-xs">.glass</code> for most floating elements</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>Use <code className="bg-surface-muted px-1 rounded text-xs">.glass-sm</code> for subtle overlays</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>Use <code className="bg-surface-muted px-1 rounded text-xs">.glass-lg</code> for prominent sections</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>Always include <code className="bg-surface-muted px-1 rounded text-xs">rounded-xl</code> or similar</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>Test in light and dark modes with actual content</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-stroke/30">
            <h4 className="font-semibold text-text mb-2">Responsive Tailwind Classes</h4>
            <div className="space-y-2 text-sm text-muted font-mono">
              <p><code>backdrop-blur-sm</code> - 8px blur</p>
              <p><code>backdrop-blur-md</code> - 12px blur</p>
              <p><code>backdrop-blur-lg</code> - 18px blur</p>
              <p><code>backdrop-blur-xl</code> - 24px blur</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
