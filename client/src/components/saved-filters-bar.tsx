import { useState } from "react";
import type { SavedFilter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark, Star, X, Plus, Check } from "lucide-react";

type SavedFiltersBarProps = {
  savedFilters: SavedFilter[];
  activeFilterId: string | null;
  onApply: (filter: SavedFilter) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  hasActiveFilters: boolean;
  isSaving: boolean;
};

export function SavedFiltersBar({
  savedFilters,
  activeFilterId,
  onApply,
  onSave,
  onDelete,
  onSetDefault,
  hasActiveFilters,
  isSaving,
}: SavedFiltersBarProps) {
  const [isNaming, setIsNaming] = useState(false);
  const [filterName, setFilterName] = useState("");

  const handleSave = () => {
    if (!filterName.trim()) return;
    onSave(filterName.trim());
    setFilterName("");
    setIsNaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setIsNaming(false); setFilterName(""); }
  };

  return (
    <div className="flex items-center gap-2 mt-4 mb-2 flex-wrap" data-testid="saved-filters-bar">
      <Bookmark className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex-shrink-0">Quick Views:</span>

      {savedFilters.map((filter) => (
        <div
          key={filter.id}
          className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
            activeFilterId === filter.id
              ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
              : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
          }`}
          onClick={() => onApply(filter)}
          data-testid={`button-saved-filter-${filter.id}`}
        >
          {filter.isDefault && (
            <Star className="w-3 h-3 fill-current text-amber-500 dark:text-amber-400 flex-shrink-0" />
          )}
          <span>{filter.name}</span>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onSetDefault(filter.id); }}
            title="Set as default view"
            data-testid={`button-set-default-${filter.id}`}
          >
            <Star className={`w-3 h-3 ${filter.isDefault ? "fill-current text-amber-500" : ""}`} />
          </button>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(filter.id); }}
            title="Delete saved view"
            data-testid={`button-delete-filter-${filter.id}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {isNaming ? (
        <div className="inline-flex items-center gap-1.5">
          <Input
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Name this view..."
            className="h-7 w-40 text-xs"
            autoFocus
            data-testid="input-filter-name"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleSave}
            disabled={!filterName.trim() || isSaving}
            data-testid="button-confirm-save-filter"
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => { setIsNaming(false); setFilterName(""); }}
            data-testid="button-cancel-save-filter"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setIsNaming(true)}
            data-testid="button-save-current-view"
          >
            <Plus className="w-3.5 h-3.5" />
            Save this view
          </Button>
        )
      )}

      {savedFilters.length === 0 && !hasActiveFilters && (
        <span className="text-xs text-muted-foreground/60 italic">Apply filters below, then save them here for quick access</span>
      )}
    </div>
  );
}
