"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus,
  Trash2,
  Download,
  Edit3,
  Copy,
  Settings,
  Home,
  Building2,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

// Initial data
const initialData = [
  {
    id: 1,
    form_safety_id: 1,
    name: "PPE งานซ่อมบำรุง และงานก่อสร้าง (Maintenance / Construction)",
    imagePath: "/img/maintenance.png",
    alt: "รูป PPE (ME)",
    type: "multiselect",
    subject: "งานที่สังเกตุ",
    placeholder: "ระบุงานที่สังเกตุ",
    title:"ประเภทอุปกรณ์ PPE ที่สังเกตุ",
    departcategory: [
      { id: 1, name: "CV" },
      { id: 2, name: "MT" },
      { id: 3, name: "AUX" },
      { id: 4, name: "SUB-VCS" },
      { id: 5, name: "SUB-STN" },
      { id: 6, name: "SUB-SDS" },
      { id: 7, name: "SUB-3SL" },
    ],
    option: [
      { id: 1, name: "หมวกเซฟตี้" },
      { id: 2, name: "รองเท้าเซฟตี้" },
      { id: 3, name: "เสื้อสะท้อนแสง" },
      { id: 4, name: "อุปกรณ์ป้องกันดวงตา" },
      { id: 5, name: "อุปกรณ์ป้องกันการตก" },
      { id: 6, name: "อุปกรณ์ป้องกันระบบทางเดินหายใจ" },
      { id: 7, name: "อุปกรณ์ป้องกันมือหรือผิวหนัง" },
    ],
  },
  {
    id: 2,
    form_safety_id: 1,
    name: "PPE งานไฟฟ้า (Electrical)",
    imagePath: "/img/electrical.png",
    alt: "รูป PPE (EE)",
    type: "multiselect",
    subject: "งานที่สังเกตุ",
    placeholder: "ระบุงานที่สังเกตุ",
    title:"ประเภทอุปกรณ์ PPE ที่สังเกตุ",
    departcategory: [
      { id: 1, name: "CV" },
      { id: 2, name: "MT" },
      { id: 3, name: "AUX" },
    ],
    option: [
      { id: 1, name: "หมวกเซฟตี้" },
      { id: 2, name: "รองเท้าเซฟตี้" },
      { id: 3, name: "เสื้อสะท้อนแสง" },
      { id: 4, name: "อุปกรณ์ป้องกันดวงตา" },
      { id: 5, name: "อุปกรณ์ป้องกันการตก" },
      { id: 6, name: "อุปกรณ์ป้องกันระบบทางเดินหายใจ" },
      { id: 7, name: "อุปกรณ์ป้องกันมือหรือผิวหนัง" },
      { id: 8, name: "อุปกรณ์ป้องกันไฟฟ้า" },
    ],
  },
  {
    id: 10,
    form_safety_id: 4,
    name: "สภาพแวดล้อมที่ไม่ปลอดภัย Plant / Unsafe Condition (UC)",
    imagePath: "/img/condition.png",
    alt: "Plan/Unsafe Condition (UC)",
    type: "option",
    subject: "พื้นที่พบเจอ",
    placeholder: "ระบุพื้นที่พบเจอ",
    title:"ประเภทความเสี่ยง Unsafe condition",
    departcategory: [
      { id: 1, name: "CV" },
      { id: 2, name: "MO" },
      { id: 3, name: "MT" },
      { id: 4, name: "AUX" },
      { id: 5, name: "OE" },
    ],
    option: [
      {
        id: 1,
        name: "1. เครื่องมือ/เครื่องจักรไม่ปลอดภัย (Unsafe Tools/Equipment) เช่น เครื่องมือชำรุด แตกหัก บิ่น /เครื่องจักรไม่มีฝาครอบป้องกัน (Machine Guard) / ไม่มีระบบตัดไฟอัตโนมัติเมื่อฉุกเฉิน",
      },
      {
        id: 2,
        name: "2. ระบบไฟฟ้าไม่ปลอดภัย (Unsafe Electrical Systems) เช่น สายไฟชำรุด เปลือย ไหม้ / ปลั๊ก เต้ารับ หลวม หรือมีคราบเขม่า /  ไม่มีระบบสายดิน (Grounding)",
      },
      { id: 8, name: "8. อื่นๆ" },
    ],
  }
];

interface Department {
    id: number;
    name: string;
}

interface Option {
    id: number;
    name: string;
}

interface SafetyCategoryItem {
    id: number;
    form_safety_id: number;
    name: string;
    imagePath: string;
    alt: string;
    type: string;
    subject: string;
    placeholder: string;
    title: string;
    departcategory: Department[];
    option: Option[];
}

const SafetyCategoryForm = () => {
  const [data, setData] = useState(initialData);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set<number>());
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const router = useRouter();

  // Toggle expand/collapse

const toggleExpand = (id: number) => {
    const newExpanded = new Set<number>(expandedItems);
    if (newExpanded.has(id)) {
        newExpanded.delete(id);
    } else {
        newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
};

  // Get next available ID
interface GetNextIdType {
    (type: 'main' | 'department' | 'option'): number;
}

const getNextId: GetNextIdType = (type) => {
    if (type === 'main') {
        return Math.max(...data.map((item: SafetyCategoryItem) => item.id)) + 1;
    } else if (type === 'department') {
        const allDepts: Department[] = data.flatMap((item: SafetyCategoryItem) => item.departcategory || []);
        return allDepts.length > 0 ? Math.max(...allDepts.map((dept: Department) => dept.id)) + 1 : 1;
    } else if (type === 'option') {
        const allOptions: Option[] = data.flatMap((item: SafetyCategoryItem) => item.option || []);
        return allOptions.length > 0 ? Math.max(...allOptions.map((opt: Option) => opt.id)) + 1 : 1;
    }
    return 1;
};

  // Add new main item
  const addNewItem = () => {
    const newItem = {
      id: getNextId('main'),
      form_safety_id: 1,
      name: "หมวดหมู่ใหม่",
      imagePath: "/img/default.png",
      alt: "รูป",
      type: "multiselect",
      subject: "งานที่สังเกตุ",
      placeholder: "ระบุงานที่สังเกตุ",
      title: "หัวข้อใหม่",
      departcategory: [],
      option: []
    };
    setData([...data, newItem]);
    setEditingItem(newItem.id);
    setExpandedItems(new Set([...expandedItems, newItem.id]));
  };

  // Delete main item
interface DeleteItemType {
    (id: number): void;
}

const deleteItem: DeleteItemType = (id) => {
    setData(data.filter((item: SafetyCategoryItem) => item.id !== id));
    const newExpanded = new Set<number>(expandedItems);
    newExpanded.delete(id);
    setExpandedItems(newExpanded);
};

  // Update main item
interface UpdateItemType {
    (id: number, field: keyof SafetyCategoryItem, value: any): void;
}

const updateItem: UpdateItemType = (id, field, value) => {
    setData(data.map((item: SafetyCategoryItem) => 
        item.id === id ? { ...item, [field]: value } : item
    ));
};

  // Add department
interface AddDepartmentType {
    (itemId: number, name: string): void;
}

const addDepartment: AddDepartmentType = (itemId, name) => {
    if (!name.trim()) return;
    setData(data.map((item: SafetyCategoryItem) => {
        if (item.id === itemId) {
            const newDept: Department = { id: getNextId('department'), name: name.trim() };
            return { ...item, departcategory: [...(item.departcategory || []), newDept] };
        }
        return item;
    }));
};

  // Delete department
interface DeleteDepartmentType {
    (itemId: number, deptId: number): void;
}

const deleteDepartment: DeleteDepartmentType = (itemId, deptId) => {
    setData(data.map((item: SafetyCategoryItem) => {
        if (item.id === itemId) {
            return { ...item, departcategory: item.departcategory.filter((dept: Department) => dept.id !== deptId) };
        }
        return item;
    }));
};

  // Add option
interface AddOptionType {
    (itemId: number, name: string): void;
}

const addOption: AddOptionType = (itemId, name) => {
    if (!name.trim()) return;
    setData(data.map((item: SafetyCategoryItem) => {
        if (item.id === itemId) {
            const newOption: Option = { id: getNextId('option'), name: name.trim() };
            return { ...item, option: [...(item.option || []), newOption] };
        }
        return item;
    }));
};

  // Delete option
interface DeleteOptionType {
    (itemId: number, optionId: number): void;
}

const deleteOption: DeleteOptionType = (itemId, optionId) => {
    setData(data.map((item: SafetyCategoryItem) => {
        if (item.id === itemId) {
            return { ...item, option: item.option.filter((opt: Option) => opt.id !== optionId) };
        }
        return item;
    }));
};

  // Update option
interface UpdateOptionType {
    (itemId: number, optionId: number, name: string): void;
}

const updateOption: UpdateOptionType = (itemId, optionId, name) => {
    setData(data.map((item: SafetyCategoryItem) => {
        if (item.id === itemId) {
            return {
                ...item,
                option: item.option.map((opt: Option) =>
                    opt.id === optionId ? { ...opt, name } : opt
                )
            };
        }
        return item;
    }));
};

  // Export as JSON
  const exportJson = () => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sub_safetyCategoryData.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    const jsonData = `export const sub_safetyCategoryData = ${JSON.stringify(data, null, 2)};`;
    navigator.clipboard.writeText(jsonData);
    alert('คัดลอกข้อมูลไปยัง clipboard แล้ว!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="h-6 w-6 text-orange-500" />
                จัดการข้อมูล Safety Category
              </h1>
              <p className="text-gray-600 mt-1">
                แก้ไขและจัดการข้อมูลหมวดหมู่ความปลอดภัย
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={addNewItem}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มหมวดหมู่
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                >
                  <Home/>
                </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">แก้ไขข้อมูล</TabsTrigger>
            <TabsTrigger value="preview">ดูตัวอย่าง JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{data.length}</div>
                  <div className="text-sm text-gray-600">หมวดหมู่ทั้งหมด</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {data.reduce((sum, item) => sum + (item.departcategory?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">แผนกทั้งหมด</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.reduce((sum, item) => sum + (item.option?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">ตัวเลือกทั้งหมด</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.filter(item => item.type === "multiselect").length}
                  </div>
                  <div className="text-sm text-gray-600">Multi-select</div>
                </CardContent>
              </Card>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              {data.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <Collapsible
                    open={expandedItems.has(item.id)}
                    onOpenChange={() => toggleExpand(item.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {expandedItems.has(item.id) ? (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            )}
                            <div>
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">ID: {item.id}</Badge>
                                <Badge variant="outline">Safety ID: {item.form_safety_id}</Badge>
                                <Badge className={item.type === "multiselect" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                                  {item.type}
                                </Badge>
                                <Badge variant="secondary">
                                  {item.departcategory?.length || 0} แผนก
                                </Badge>
                                <Badge variant="secondary">
                                  {item.option?.length || 0} ตัวเลือก
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem(editingItem === item.id ? null : item.id);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(item.id);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="border-t bg-gray-50">
                        {editingItem === item.id ? (
                          <EditForm 
                            item={item}
                            onUpdate={updateItem}
                            onAddDepartment={addDepartment}
                            onDeleteDepartment={deleteDepartment}
                            onAddOption={addOption}
                            onDeleteOption={deleteOption}
                            onUpdateOption={updateOption}
                          />
                        ) : (
                          <ViewForm item={item} />
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>ตัวอย่าง JSON Output</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={copyToClipboard} variant="outline">
                      <Copy className="h-4 w-4 mr-2" />
                      คัดลอก
                    </Button>
                    <Button onClick={exportJson} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      ดาวน์โหลด
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                  {`export const sub_safetyCategoryData = ${JSON.stringify(data, null, 2)};`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Edit Form Component
// Define UpdateItemType if not already defined above
type UpdateItemType = (id: number, field: keyof SafetyCategoryItem, value: any) => void;

interface EditFormProps {
  item: SafetyCategoryItem;
  onUpdate: UpdateItemType;
  onAddDepartment: (itemId: number, name: string) => void;
  onDeleteDepartment: (itemId: number, deptId: number) => void;
  onAddOption: (itemId: number, name: string) => void;
  onDeleteOption: (itemId: number, optionId: number) => void;
  onUpdateOption: (itemId: number, optionId: number, name: string) => void;
}

const EditForm: React.FC<EditFormProps> = ({ 
  item, 
  onUpdate, 
  onAddDepartment, 
  onDeleteDepartment, 
  onAddOption, 
  onDeleteOption, 
  onUpdateOption 
}) => {
  const [newDeptName, setNewDeptName] = useState("");
  const [newOptionName, setNewOptionName] = useState("");

  return (
    <div className="space-y-6 p-4">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">ID</label>
          <Input 
            type="number"
            value={item.id} 
            onChange={(e) => onUpdate(item.id, 'id', parseInt(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Form Safety ID</label>
          <Input 
            type="number"
            value={item.form_safety_id} 
            onChange={(e) => onUpdate(item.id, 'form_safety_id', parseInt(e.target.value))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">ชื่อหมวดหมู่</label>
          <Input 
            value={item.name} 
            onChange={(e) => onUpdate(item.id, 'name', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Image Path</label>
          <Input 
            value={item.imagePath} 
            onChange={(e) => onUpdate(item.id, 'imagePath', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Alt Text</label>
          <Input 
            value={item.alt} 
            onChange={(e) => onUpdate(item.id, 'alt', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <Select value={item.type} onValueChange={(value) => onUpdate(item.id, 'type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiselect">Multi-select</SelectItem>
              <SelectItem value="option">Single Option</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Subject</label>
          <Input 
            value={item.subject} 
            onChange={(e) => onUpdate(item.id, 'subject', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Placeholder</label>
          <Input 
            value={item.placeholder} 
            onChange={(e) => onUpdate(item.id, 'placeholder', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Title</label>
          <Input 
            value={item.title} 
            onChange={(e) => onUpdate(item.id, 'title', e.target.value)}
          />
        </div>
      </div>

      {/* Departments */}
      <div>
        <label className="block text-sm font-medium mb-2">แผนกที่เกี่ยวข้อง</label>
        <div className="flex gap-2 mb-3">
          <Input 
            placeholder="ชื่อแผนก" 
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onAddDepartment(item.id, newDeptName);
                setNewDeptName("");
              }
            }}
          />
          <Button 
            onClick={() => {
              onAddDepartment(item.id, newDeptName);
              setNewDeptName("");
            }}
            disabled={!newDeptName.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.departcategory?.map((dept) => (
            <Badge key={dept.id} variant="secondary" className="flex items-center gap-2">
              <Building2 className="h-3 w-3" />
              {dept.name}
              <button
                onClick={() => onDeleteDepartment(item.id, dept.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium mb-2">ตัวเลือก</label>
        <div className="flex gap-2 mb-3">
          <Input 
            placeholder="ตัวเลือกใหม่" 
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onAddOption(item.id, newOptionName);
                setNewOptionName("");
              }
            }}
          />
          <Button 
            onClick={() => {
              onAddOption(item.id, newOptionName);
              setNewOptionName("");
            }}
            disabled={!newOptionName.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {item.option?.map((option) => (
            <div key={option.id} className="flex gap-2 items-start">
              <Badge variant="outline" className="mt-1 flex-shrink-0">
                {option.id}
              </Badge>
              <Textarea
                value={option.name}
                onChange={(e) => onUpdateOption(item.id, option.id, e.target.value)}
                className="flex-1 min-h-[60px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteOption(item.id, option.id)}
                className="text-red-600 hover:text-red-700 mt-1"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// View Form Component
const ViewForm: React.FC<{ item: SafetyCategoryItem }> = ({ item }) => {
  return (
    <>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Subject</label>
            <p className="text-sm">{item.subject}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Type</label>
            <p className="text-sm">
              <Badge className={item.type === "multiselect" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                {item.type}
              </Badge>
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600">Placeholder</label>
            <p className="text-sm text-gray-500 italic">{item.placeholder}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600">Title</label>
            <p className="text-sm font-medium">{item.title}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">แผนกที่เกี่ยวข้อง</label>
          <div className="flex flex-wrap gap-2">
            {item.departcategory?.map((dept) => (
              <Badge key={dept.id} variant="secondary">
                <Building2 className="h-3 w-3 mr-1" />
                {dept.name}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">ตัวเลือก ({item.option?.length || 0} รายการ)</label>
          <div className="space-y-2">
            {item.option?.map((option) => (
              <div key={option.id} className="flex gap-2 items-start text-sm">
                <Badge variant="outline" className="flex-shrink-0">
                  {option.id}
                </Badge>
                <span>{option.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SafetyCategoryForm;