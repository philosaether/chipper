/**
 * KeywordGroupList — shared rendering for grouped keywords.
 *
 * Renders NormalizedKeywordGroup[] as visual sections with optional
 * labels, prefixes, and flow/grid layouts. Used by KOE, multi-select,
 * and alt-coordinate popups.
 *
 * See keyword-grouping.md.
 */

import type { Keyword, SentenceContext } from '../../core/types';
import type { NormalizedKeywordGroup } from '../../domains/normalize-keywords';
import { resolveKeywordLabel } from '../../core/resolve-keyword-label';

export interface KeywordGroupListProps {
  groups: NormalizedKeywordGroup<string>[];
  context?: SentenceContext;
  /** Called with the keyword's flat index (across all groups) */
  getOptionProps: (index: number) => Record<string, unknown>;
  /** Render selected state for a keyword */
  isSelected?: (keyword: Keyword<string>) => boolean;
  /** Render disabled state for a keyword */
  isDisabled?: (keyword: Keyword<string>) => boolean;
}

/**
 * Render grouped keywords with labels, prefixes, and layout variants.
 *
 * Flat keyword index is computed by summing keywords in prior groups,
 * so keyboard navigation stays linear across all groups.
 */
export function KeywordGroupList({
  groups,
  context,
  getOptionProps,
  isSelected,
  isDisabled,
}: KeywordGroupListProps) {
  let flatIndex = 0;

  return (
    <>
      {groups.map((group, groupIndex) => {
        const startIndex = flatIndex;
        flatIndex += group.keywords.length;

        const layoutClass = group.layout === 'grid'
          ? 'chipper-keyword-group__items--grid'
          : 'chipper-keyword-group__items--flow';

        const gridStyle = group.layout === 'grid' && group.columns
          ? { '--chipper-group-columns': group.columns } as React.CSSProperties
          : undefined;

        return (
          <div key={groupIndex} className="chipper-keyword-group">
            {groupIndex > 0 && (
              <hr className="chipper-keyword-group__separator" />
            )}
            {group.label && (
              <span className="chipper-keyword-group__label">{group.label}</span>
            )}
            <div className={`chipper-keyword-group__items ${layoutClass}`} style={gridStyle}>
              {group.prefix && (
                <span className="chipper-keyword-group__prefix">{group.prefix}</span>
              )}
              {group.keywords.map((keyword, kwIndex) => {
                const index = startIndex + kwIndex;
                const optionProps = getOptionProps(index);
                const selected = isSelected?.(keyword) ?? false;
                const disabled = isDisabled?.(keyword) ?? false;
                return (
                  <button
                    key={`${keyword.value}-${index}`}
                    type="button"
                    {...optionProps}
                    aria-selected={selected || undefined}
                    className={[
                      (optionProps as { className?: string }).className,
                      selected && 'chipper-popup-option--selected',
                    ].filter(Boolean).join(' ')}
                    disabled={disabled}
                  >
                    {resolveKeywordLabel(keyword, context)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
