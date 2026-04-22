import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Building,
  Globe,
  Users,
  DollarSign,
  MapPin,
  Briefcase,
  Mail,
  Linkedin,
  Twitter,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/utils/supabase";
import { Startup, StartupFormData, StartupEmployeeFormData } from "@/types";

interface StartupFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startup?: Startup;
  onSuccess: () => void;
}

export function StartupFormModal({
  open,
  onOpenChange,
  startup,
  onSuccess,
}: StartupFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [sectors, setSectors] = useState<string[]>([]);
  const [showCustomSector, setShowCustomSector] = useState(false);
  const [customSector, setCustomSector] = useState("");
  const [formData, setFormData] = useState<StartupFormData>({
    name: "",
    description: "",
    website: "",
    sector: "",
    location: "",
    funding_round: "",
    funding_amount: "",
    team_size: "",
    logo_url: "",
    is_hiring: false,
    tags: [],
    slug: "",
    is_trending: false,
    employees: [{ name: "", role: "", email: "", linkedin_url: "" }],
  });
  const [tagInput, setTagInput] = useState("");

  // fetch unique sectors from db
  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const { data, error } = await supabase
          .from("startups")
          .select("sector")
          .not("sector", "is", null)
          .not("sector", "eq", "");

        if (error) throw error;

        // extract unique sectors and sort alphabetically
        const uniqueSectors = [
          ...new Set(data.map((item) => item.sector)),
        ].sort();
        setSectors(uniqueSectors);
      } catch (error) {
        console.error("Error fetching sectors:", error);
      }
    };

    if (open) {
      fetchSectors();
    }
  }, [open]);

  // init form data when startup changes
  useEffect(() => {
    if (startup) {
      const sectorValue = startup.sector || "";
      const isCustomSector = Boolean(
        sectorValue && !sectors.includes(sectorValue)
      );

      setFormData({
        name: startup.name || "",
        slug: startup.slug || "",
        description: startup.description || "",
        website: startup.website || "",
        sector: isCustomSector ? "other" : sectorValue,
        location: startup.location || "",
        funding_round: startup.funding_round || "",
        funding_amount: startup.funding_amount || "",
        team_size: startup.team_size || "",
        logo_url: startup.logo_url || "",
        is_hiring: startup.is_hiring || false,
        tags: startup.tags || [],
        is_trending: startup.is_trending,
        employees: startup.employees?.map((emp) => ({
          name: emp.name,
          role: emp.role || "",
          email: emp.email,
          linkedin_url: emp.linkedin_url || "",
        })) || [{ name: "", role: "", email: "", linkedin_url: "" }],
      });

      setShowCustomSector(isCustomSector);
      setCustomSector(isCustomSector ? sectorValue : "");
    } else {
      // reset for new startup
      setFormData({
        name: "",
        slug: "",
        description: "",
        website: "",
        sector: "",
        location: "",
        funding_round: "",
        funding_amount: "",
        team_size: "",
        logo_url: "https://placehold.co/400",
        is_hiring: false,
        is_trending: false,
        tags: [],
        employees: [{ name: "", role: "", email: "", linkedin_url: "" }],
      });
      setShowCustomSector(false);
      setCustomSector("");
    }
    setTagInput("");
  }, [startup, open, sectors]);

  // slug helpers
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const checkSlugUnique = async (slug: string): Promise<boolean> => {
    if (!slug) return false;
    try {
      const { data, error } = await supabase
        .from("startups")
        .select("id")
        .eq("slug", slug)
        .limit(1);
      if (error) throw error;
      const existing = (data || [])[0];
      if (!existing) return true;
      // allow same slug for the startup being edited
      if (startup && existing.id === startup.id) return true;
      return false;
    } catch (e) {
      console.error("Error checking slug uniqueness:", e);
      // On error, be safe and mark as not unique to prevent bad saves
      return false;
    }
  };

  const handleInputChange = (field: keyof StartupFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSectorChange = (value: string) => {
    if (value === "other") {
      setShowCustomSector(true);
      setFormData((prev) => ({ ...prev, sector: "other" }));
    } else {
      setShowCustomSector(false);
      setCustomSector("");
      setFormData((prev) => ({ ...prev, sector: value }));
    }
  };

  const addEmployee = () => {
    setFormData((prev) => ({
      ...prev,
      employees: [
        ...prev.employees,
        { name: "", role: "", email: "", linkedin_url: "" },
      ],
    }));
  };

  const removeEmployee = (index: number) => {
    if (formData.employees.length > 1) {
      setFormData((prev) => ({
        ...prev,
        employees: prev.employees.filter((_, i) => i !== index),
      }));
    }
  };

  const updateEmployee = (
    index: number,
    field: keyof StartupEmployeeFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      employees: prev.employees.map((emp, i) =>
        i === index ? { ...emp, [field]: value } : emp
      ),
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ensure slug present and unique
      const cleanSlug = slugify(formData.slug || "");
      if (!cleanSlug) {
        alert("Please provide a valid slug (letters, numbers, dashes).");
        setLoading(false);
        return;
      }
      const unique = await checkSlugUnique(cleanSlug);
      if (!unique) {
        alert("Slug is already taken. Please choose a different one.");
        setLoading(false);
        return;
      }

      const sectorValue =
        formData.sector === "other" ? customSector : formData.sector;

      const startupData = {
        name: formData.name,
        description: formData.description || null,
        website: formData.website || null,
        sector: sectorValue || null,
        location: formData.location || null,
        funding_round: formData.funding_round || null,
        funding_amount: formData.funding_amount || null,
        team_size: formData.team_size || null,
        logo_url: formData.logo_url || "https://placehold.co/400",
        is_hiring: formData.is_hiring,
        status: "verified",
        slug: cleanSlug,
      };

      let startupId: string;

      if (startup) {
        // updt existing startup
        const { error: startupError } = await supabase
          .from("startups")
          .update(startupData)
          .eq("id", startup.id);

        if (startupError) throw startupError;
        startupId = startup.id;
      } else {
        // create new startup
        const { data: newStartup, error: startupError } = await supabase
          .from("startups")
          .insert(startupData)
          .select()
          .single();

        if (startupError) throw startupError;
        startupId = newStartup.id;
      }

      // handle employees
      if (startup) {
        // del existing employees first
        await supabase
          .from("startup_employees")
          .delete()
          .eq("startup_id", startupId);
      }

      // add new employees
      const validEmployees = formData.employees.filter(
        (emp) => emp.name.trim() && emp.email.trim()
      );

      if (validEmployees.length > 0) {
        const employeeData = validEmployees.map((emp) => ({
          startup_id: startupId,
          name: emp.name.trim(),
          role: emp.role?.trim() || null,
          email: emp.email.trim(),
          linkedin_url: emp.linkedin_url?.trim() || null,
          status: "pending",
        }));

        const { error: employeeError } = await supabase
          .from("startup_employees")
          .insert(employeeData);

        if (employeeError) throw employeeError;
      }

      // handle tags
      if (startup) {
        // del existing tags
        await supabase
          .from("startup_tags")
          .delete()
          .eq("startup_id", startupId);
      }

      if (formData.tags && formData.tags.length > 0) {
        const tagData = formData.tags.map((tag) => ({
          startup_id: startupId,
          tag: tag.trim(),
        }));

        const { error: tagError } = await supabase
          .from("startup_tags")
          .insert(tagData);

        if (tagError) throw tagError;
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving startup:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>{startup ? "Edit Startup" : "Add New Startup"}</span>
            </div>
          </DialogTitle>
          <DialogClose onClose={() => onOpenChange(false)} />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* basic info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Startup Name *
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                onBlur={() => {
                  if (!formData.slug && formData.name) {
                    handleInputChange("slug", slugify(formData.name));
                  }
                }}
                placeholder="Enter startup name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Logo URL *
              </label>
              <Input
                required
                value={formData.logo_url}
                onChange={(e) => handleInputChange("logo_url", e.target.value)}
                placeholder="Enter logo URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug *</label>
              <Input
                required
                value={formData.slug}
                onChange={(e) =>
                  handleInputChange("slug", slugify(e.target.value))
                }
                placeholder="unique-identifier"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Lowercase, letters/numbers/dashes only.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sector</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-none text-sm bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.sector || ""}
                onChange={(e) => handleSectorChange(e.target.value)}>
                <option value="">Select a sector</option>
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
                <option value="other">Other (specify new)</option>
              </select>
              {showCustomSector && (
                <Input
                  className="mt-2"
                  value={customSector}
                  onChange={(e) => setCustomSector(e.target.value)}
                  placeholder="Enter custom sector"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 border border-input rounded-none text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-background"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the startup"
            />
          </div>

          {/* location & team */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location
              </label>
              <Input
                value={formData.location || ""}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="e.g., San Francisco, Remote"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Team Size
              </label>
              <Input
                value={formData.team_size || ""}
                onChange={(e) => handleInputChange("team_size", e.target.value)}
                placeholder="e.g., 10-50, 50+"
              />
            </div>
          </div>

          {/* urls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                Website
              </label>
              <Input
                type="url"
                value={formData.website || ""}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Linkedin className="inline h-4 w-4 mr-1" />
                LinkedIn
              </label>
              <Input
                type="url"
                placeholder="https://linkedin.com/company/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Twitter className="inline h-4 w-4 mr-1" />
                Twitter
              </label>
              <Input type="url" placeholder="https://twitter.com/..." />
            </div>
          </div>

          {/* funding info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Funding Round
              </label>
              <Input
                value={formData.funding_round || ""}
                onChange={(e) =>
                  handleInputChange("funding_round", e.target.value)
                }
                placeholder="e.g., Seed, Series A, Series B"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Funding Amount
              </label>
              <Input
                value={formData.funding_amount || ""}
                onChange={(e) =>
                  handleInputChange("funding_amount", e.target.value)
                }
                placeholder="e.g., $1M, $5M, $10M"
              />
            </div>
          </div>

          {/* tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <Input
                className="flex-1"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                className="sm:w-auto w-full">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center space-x-1">
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:bg-red-100 rounded-full p-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-8 py-2">
            {/* hiring toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_hiring}
                onCheckedChange={(checked) =>
                  handleInputChange("is_hiring", checked)
                }
              />
              <label className="text-sm font-medium">
                <Briefcase className="inline h-4 w-4 mr-1" />
                Currently Hiring
              </label>
            </div>

            {/* trending toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                // className="bg-yellow-300"
                checked={formData.is_trending}
                onCheckedChange={(trending) =>
                  handleInputChange("is_trending", trending)
                }
              />
              <label className="text-sm font-medium">
                <TrendingUp className="inline h-4 w-4 mr-1" />
                Trending
              </label>
            </div>
          </div>

          {/* employees section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <label className="block text-sm font-medium">Employees</label>
              <Button
                type="button"
                onClick={addEmployee}
                variant="outline"
                size="sm"
                className="sm:w-auto w-full">
                <Plus className="h-4 w-4 mr-1" />
                Add Employee
              </Button>
            </div>

            <div className="space-y-4">
              {formData.employees.map((employee, index) => (
                <div
                  key={index}
                  className="border rounded-none p-4 bg-background">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">
                      Employee #{index + 1}
                    </h4>
                    {formData.employees.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeEmployee(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Name *
                      </label>
                      <Input
                        required
                        value={employee.name}
                        onChange={(e) =>
                          updateEmployee(index, "name", e.target.value)
                        }
                        placeholder="Employee name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Role
                      </label>
                      <Input
                        value={employee.role || ""}
                        onChange={(e) =>
                          updateEmployee(index, "role", e.target.value)
                        }
                        placeholder="e.g., CEO, CTO, Marketing Lead"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        <Mail className="inline h-3 w-3 mr-1" />
                        Email *
                      </label>
                      <Input
                        type="email"
                        required
                        value={employee.email}
                        onChange={(e) =>
                          updateEmployee(index, "email", e.target.value)
                        }
                        placeholder="employee@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        <Linkedin className="inline h-3 w-3 mr-1" />
                        LinkedIn
                      </label>
                      <Input
                        type="url"
                        value={employee.linkedin_url || ""}
                        onChange={(e) =>
                          updateEmployee(index, "linkedin_url", e.target.value)
                        }
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-foreground border border-gray-300 w-full sm:w-auto">
              {loading
                ? "Saving..."
                : startup
                ? "Update Startup"
                : "Create Startup"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
