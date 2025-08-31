"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Flag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings,
  CheckSquare,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { NotionConfig } from "./notion-config";

interface Task {
  id: string;
  title: string;
  status: "Not Started" | "In Progress" | "Done" | "Blocked";
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignee?: string;
  due_date?: string;
  description?: string;
  created_at: string;
}

interface CreateTaskForm {
  title: string;
  status: "Not Started" | "In Progress" | "Done" | "Blocked";
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignee: string;
  due_date: string;
  description: string;
}

const priorityColors = {
  Low: "bg-blue-100 text-blue-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-orange-100 text-orange-800",
  Urgent: "bg-red-100 text-red-800",
};

const statusColors = {
  "Not Started": "bg-gray-100 text-gray-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Done: "bg-green-100 text-green-800",
  Blocked: "bg-red-100 text-red-800",
};

export function TaskManager() {
  const _t = useTranslations();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDatabase, _setSelectedDatabase] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignee: "",
  });
  const [createForm, setCreateForm] = useState<CreateTaskForm>({
    title: "",
    status: "Not Started",
    priority: "Medium",
    assignee: "",
    due_date: "",
    description: "",
  });

  // Load mock data for demonstration
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: "task-1",
        title: "Complete project documentation",
        status: "In Progress",
        priority: "High",
        assignee: "John Doe",
        due_date: "2024-01-15",
        description:
          "Write comprehensive documentation for the new API endpoints",
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: "task-2",
        title: "Review code changes",
        status: "Not Started",
        priority: "Medium",
        assignee: "Jane Smith",
        due_date: "2024-01-20",
        description: "Review pull request #123 for the authentication module",
        created_at: "2024-01-02T14:30:00Z",
      },
      {
        id: "task-3",
        title: "Setup CI/CD pipeline",
        status: "Done",
        priority: "High",
        assignee: "Mike Johnson",
        due_date: "2024-01-10",
        description: "Configure automated testing and deployment pipeline",
        created_at: "2024-01-01T09:00:00Z",
      },
    ];
    setTasks(mockTasks);
    setFilteredTasks(mockTasks);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = tasks;

    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }
    if (filters.assignee) {
      filtered = filtered.filter((task) =>
        task.assignee?.toLowerCase().includes(filters.assignee.toLowerCase()),
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, filters]);

  const handleCreateTask = useCallback(() => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...createForm,
      created_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setCreateForm({
      title: "",
      status: "Not Started",
      priority: "Medium",
      assignee: "",
      due_date: "",
      description: "",
    });
    setIsCreateDialogOpen(false);
  }, [createForm]);

  const handleStatusChange = useCallback(
    (taskId: string, newStatus: Task["status"]) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task,
        ),
      );
    },
    [],
  );

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const getPriorityIcon = (priority: Task["priority"]) => {
    switch (priority) {
      case "Urgent":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "High":
        return <Flag className="w-4 h-4 text-orange-600" />;
      case "Medium":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "Low":
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Manager</h2>
          <p className="text-muted-foreground">Manage your Notion tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={createForm.title}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter task title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={createForm.status}
                      onValueChange={(value: Task["status"]) =>
                        setCreateForm((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={createForm.priority}
                      onValueChange={(value: Task["priority"]) =>
                        setCreateForm((prev) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assignee">Assignee</Label>
                    <Input
                      id="assignee"
                      value={createForm.assignee}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          assignee: e.target.value,
                        }))
                      }
                      placeholder="Enter assignee name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={createForm.due_date}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          due_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTask}
                    disabled={!createForm.title}
                  >
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Database Selection Warning */}
      {!selectedDatabase && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Currently using mock data. Configure your Notion integration in the
            Settings tab to connect to real data.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority-filter">Priority</Label>
                  <Select
                    value={filters.priority}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All priorities</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignee-filter">Assignee</Label>
                  <Input
                    id="assignee-filter"
                    value={filters.assignee}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        assignee: e.target.value,
                      }))
                    }
                    placeholder="Filter by assignee"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={task.status === "Done"}
                          onCheckedChange={(checked) =>
                            handleStatusChange(
                              task.id,
                              checked ? "Done" : "Not Started",
                            )
                          }
                        />
                        <h3 className="font-medium">{task.title}</h3>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {task.assignee && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.assignee}
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(task.priority)}
                        <Badge className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                      </div>
                      <Badge className={statusColors[task.status]}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredTasks.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No tasks found matching your filters.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <NotionConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
