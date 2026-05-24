import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { invalidateCategoriesCache } from "@/hooks/useCategories";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

interface Subcategory {
  id: number;
  name: string;
  display_order: number;
}

interface Category {
  id: number;
  name: string;
  display_order: number;
  subcategories: Subcategory[];
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);

  // Inline-edit state
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [editingSubName, setEditingSubName] = useState("");

  // New entry state
  const [newCatName, setNewCatName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.categories.getAll();
      setCategories(Array.isArray(data) ? data : []);
      // Keep selectedCat in sync
      setSelectedCat((prev) =>
        prev ? data.find((c: Category) => c.id === prev.id) ?? null : null
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refreshAndInvalidate = async () => {
    await load();
    invalidateCategoriesCache();
  };

  // ── Category CRUD ────────────────────────────────────────────────────────────

  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    setSaving(true);
    try {
      await api.admin.createCategory(name);
      setNewCatName("");
      await refreshAndInvalidate();
      toast.success(`Category "${name}" added`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add category");
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async (id: number) => {
    const name = editingCatName.trim();
    if (!name) return;
    setSaving(true);
    try {
      await api.admin.updateCategory(id, name);
      setEditingCatId(null);
      await refreshAndInvalidate();
      toast.success("Category renamed");
    } catch (err: any) {
      toast.error(err.message || "Failed to rename category");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}" and all its sub-categories? This cannot be undone.`)) return;
    try {
      await api.admin.deleteCategory(cat.id);
      if (selectedCat?.id === cat.id) setSelectedCat(null);
      await refreshAndInvalidate();
      toast.success(`Deleted "${cat.name}"`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  // ── Subcategory CRUD ─────────────────────────────────────────────────────────

  const addSubcategory = async () => {
    const name = newSubName.trim();
    if (!name || !selectedCat) return;
    setSaving(true);
    try {
      await api.admin.addSubcategory(selectedCat.id, name);
      setNewSubName("");
      await refreshAndInvalidate();
      toast.success(`Sub-category "${name}" added`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add sub-category");
    } finally {
      setSaving(false);
    }
  };

  const saveSubcategory = async (id: number) => {
    const name = editingSubName.trim();
    if (!name) return;
    setSaving(true);
    try {
      await api.admin.updateSubcategory(id, name);
      setEditingSubId(null);
      await refreshAndInvalidate();
      toast.success("Sub-category renamed");
    } catch (err: any) {
      toast.error(err.message || "Failed to rename sub-category");
    } finally {
      setSaving(false);
    }
  };

  const deleteSubcategory = async (sub: Subcategory) => {
    if (!confirm(`Delete sub-category "${sub.name}"?`)) return;
    try {
      await api.admin.deleteSubcategory(sub.id);
      await refreshAndInvalidate();
      toast.success(`Deleted "${sub.name}"`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete sub-category");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentSubs = selectedCat
    ? (categories.find((c) => c.id === selectedCat.id)?.subcategories ?? [])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Event Categories</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage categories and sub-categories. Changes reflect instantly on the Events page filters and event-creation form.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAndInvalidate}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Categories ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="w-4 h-4 text-blue-600" />
              Categories
            </CardTitle>
            <CardDescription>Click a category to manage its sub-categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {categories.map((cat) => {
              const isEditing = editingCatId === cat.id;
              const isSelected = selectedCat?.id === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                    isSelected
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200"
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Input
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveCategory(cat.id);
                          if (e.key === "Escape") setEditingCatId(null);
                        }}
                        className="h-7 text-sm flex-1"
                        autoFocus
                      />
                      <button onClick={() => saveCategory(cat.id)} disabled={saving} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingCatId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button
                        className="flex-1 text-left text-sm font-medium text-gray-800 flex items-center gap-2"
                        onClick={() => setSelectedCat(cat)}
                      >
                        <span className="flex-1">{cat.name}</span>
                        <span className="text-xs text-gray-400 font-normal">{cat.subcategories.length} sub</span>
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? "text-blue-500 rotate-90" : "text-gray-300"}`} />
                      </button>
                      <button
                        onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                        className="text-gray-400 hover:text-blue-500 p-1 rounded"
                        title="Rename"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}

            {/* Add new category */}
            <div className="flex gap-2 pt-2 border-t border-dashed border-gray-200">
              <Input
                placeholder="New category name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={addCategory} disabled={saving || !newCatName.trim()} className="h-8 px-3">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Right: Sub-categories ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ChevronRight className="w-4 h-4 text-purple-600" />
              {selectedCat ? `Sub-categories of "${selectedCat.name}"` : "Sub-categories"}
            </CardTitle>
            <CardDescription>
              {selectedCat
                ? "These appear in the event form dropdown and filter bar"
                : "Select a category on the left to manage its sub-categories"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!selectedCat ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                Select a category to manage sub-categories
              </div>
            ) : (
              <>
                {currentSubs.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">No sub-categories yet</p>
                )}

                {currentSubs.map((sub) => {
                  const isEditing = editingSubId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50"
                    >
                      {isEditing ? (
                        <>
                          <Input
                            value={editingSubName}
                            onChange={(e) => setEditingSubName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveSubcategory(sub.id);
                              if (e.key === "Escape") setEditingSubId(null);
                            }}
                            className="h-7 text-sm flex-1"
                            autoFocus
                          />
                          <button onClick={() => saveSubcategory(sub.id)} disabled={saving} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingSubId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-gray-700">{sub.name}</span>
                          <button
                            onClick={() => { setEditingSubId(sub.id); setEditingSubName(sub.name); }}
                            className="text-gray-400 hover:text-blue-500 p-1 rounded"
                            title="Rename"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteSubcategory(sub)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Add new sub-category */}
                <div className="flex gap-2 pt-2 border-t border-dashed border-gray-200">
                  <Input
                    placeholder="New sub-category name..."
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubcategory()}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={addSubcategory} disabled={saving || !newSubName.trim()} className="h-8 px-3">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
        <Tag className="w-3.5 h-3.5" />
        {categories.length} categories · {categories.reduce((n, c) => n + c.subcategories.length, 0)} sub-categories total
      </div>
    </div>
  );
}
