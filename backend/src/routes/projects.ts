import { Router, Request, Response, NextFunction } from 'express';
import { createProjectSchema, auditProjectSchema } from '../schemas/validation.js';
import * as projectService from '../services/projectService.js';
import * as dmrvService from '../services/dmrvService.js';
import * as auditService from '../services/auditService.js';

export const projectsRouter = Router();

// POST /projects
projectsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createProjectSchema.parse(req.body);
    const result = await projectService.createProject(validated);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /projects
projectsRouter.get('/', (req: Request, res: Response) => {
  const projects = projectService.getAllProjects();
  res.json(projects);
});

// GET /projects/:id
projectsRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = projectService.getProjectById(req.params.id as string);
    if (!project) {
      res.status(404).json({ error: `Project ${req.params.id} not found` });
      return;
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/analyze
projectsRouter.post('/:id/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await dmrvService.analyzeProject(req.params.id as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/audit
projectsRouter.post('/:id/audit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = auditProjectSchema.parse(req.body);
    const result = await auditService.auditProject(req.params.id as string, validated);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
