"use client"

import * as React from "react"
import { X, Check, Loader2, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDepartments, trainCorrection, getStaffProfile, type Department } from "@/dash_department/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface TrainingRouteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionUuid: string
  firstMessageText: string
  firstMessageUuid: string
}

export function TrainingRouteDialog({
  open,
  onOpenChange,
  sessionUuid,
  firstMessageText,
  firstMessageUuid,
}: TrainingRouteDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<string>("")
  const [notes, setNotes] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [staffProfile, setStaffProfile] = React.useState<{ staff_uuid?: string } | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Fetch departments on mount
  React.useEffect(() => {
    if (open) {
      fetchDepartments()
      fetchStaffProfile()
    }
  }, [open])

  const fetchDepartments = async () => {
    try {
      const depts = await getDepartments({ lang: "uz" })
      setDepartments(depts.filter(d => d.is_active))
    } catch (error) {
      console.error("Failed to fetch departments:", error)
      toast({
        title: "Xatolik",
        description: "Bo'limlarni yuklab bo'lmadi",
        variant: "destructive",
      })
    }
  }

  const fetchStaffProfile = async () => {
    try {
      const profile = await getStaffProfile()
      setStaffProfile(profile)
    } catch (error) {
      console.error("Failed to fetch staff profile:", error)
    }
  }

  const filteredDepartments = React.useMemo(() => {
    if (!searchQuery.trim()) return departments
    const query = searchQuery.toLowerCase().trim()
    return departments.filter(
      (dept) =>
        dept.name_uz?.toLowerCase().includes(query) ||
        dept.name_ru?.toLowerCase().includes(query)
    )
  }, [departments, searchQuery])

  const selectedDepartment = React.useMemo(() => {
    return departments.find(d => String(d.id) === selectedDepartmentId)
  }, [departments, selectedDepartmentId])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setIsDropdownOpen(true)
  }

  const handleDepartmentSelect = (dept: Department) => {
    setSelectedDepartmentId(String(dept.id))
    setSearchQuery(dept.name_uz || dept.name_ru || "")
    setIsDropdownOpen(false)
  }

  const handleInputFocus = () => {
    setIsDropdownOpen(true)
  }

  const handleInputClick = () => {
    // When clicking on input, if there's a selected department, clear search to show all
    if (selectedDepartment && searchQuery === (selectedDepartment.name_uz || selectedDepartment.name_ru)) {
      setSearchQuery("")
    }
    setIsDropdownOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedDepartmentId) {
      toast({
        title: "Error",
        description: "Please select a department",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await trainCorrection({
        text: firstMessageText,
        correct_department_id: selectedDepartmentId,
        message_uuid: firstMessageUuid,
        corrected_by: staffProfile?.staff_uuid || undefined,
        correction_notes: notes || undefined,
      })

      setIsSuccess(true)
      
      // Wait a bit to show success animation
      setTimeout(() => {
        onOpenChange(false)
        router.push("/train")
      }, 1500)
    } catch (error) {
      console.error("Failed to train correction:", error)
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Murojaatni yo'naltirib bo'lmadi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading && !isSuccess) {
      onOpenChange(false)
      // Reset state
      setSelectedDepartmentId("")
      setNotes("")
      setSearchQuery("")
      setIsSuccess(false)
      setIsDropdownOpen(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Dialog */}
      <Card
        className="relative z-50 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Yo'naltirish</CardTitle>
            {!isLoading && !isSuccess && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-green-500 p-3 mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg font-semibold">Muvaffaqiyatli yo'naltirildi!</p>
            </div>
          ) : (
            <>
              {/* Department Select with Search */}
              <div className="space-y-2">
                <Label htmlFor="department">Bo'lim</Label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Input
                      ref={inputRef}
                      id="department-search"
                      placeholder={selectedDepartment ? selectedDepartment.name_uz || selectedDepartment.name_ru : "Qidirish..."}
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={handleInputFocus}
                      onClick={handleInputClick}
                      className="pl-9 pr-9"
                    />
                    <ChevronDown 
                      className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    />
                  </div>
                  {isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md max-h-[300px] overflow-y-auto">
                      {filteredDepartments.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Bo'lim topilmadi
                        </div>
                      ) : (
                        filteredDepartments.map((dept) => (
                          <div
                            key={dept.id}
                            onClick={() => handleDepartmentSelect(dept)}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${
                              selectedDepartmentId === String(dept.id) ? 'bg-accent text-accent-foreground' : ''
                            }`}
                          >
                            {dept.name_uz || dept.name_ru}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Field */}
              <div className="space-y-2">
                <Label htmlFor="notes">Izoh (ixtiyoriy)</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Qo'shimcha ma'lumot..."
                  className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !selectedDepartmentId}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yo'naltirilmoqda...
                  </>
                ) : (
                  "Yo'naltirish"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

