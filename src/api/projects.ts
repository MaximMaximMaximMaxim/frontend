import { apiRequest, jsonBody } from "./client";
import type { ProjectCreate, ProjectRead } from "../types/api";

export function listProjects(): Promise<ProjectRead[]> {
  return apiRequest<ProjectRead[]>("/projects/");
}

export function createProject(payload: ProjectCreate): Promise<ProjectRead> {
  return apiRequest<ProjectRead>("/projects/", {
    method: "POST",
    body: jsonBody(payload),
  });
}

export function getProject(projectId: number): Promise<ProjectRead> {
  return apiRequest<ProjectRead>(`/projects/${projectId}`);
}
