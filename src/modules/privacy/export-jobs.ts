/**
 * Privacy Data Export Jobs & Distributed Worker Queue Manager
 * Facade Entry Point
 */

import {
  claimAndProcessExportJob,
  processNextExportJob,
} from "./jobs/export-lease.manager";
import {
  enqueueExportJob,
  getExportJobStatus,
  cancelExportJob,
  cleanupExpiredJobs,
} from "./jobs/export-bundler.service";

export * from "./jobs/types";
export * from "./jobs/export-lease.manager";
export * from "./jobs/export-bundler.service";

export class ExportJobManager {
  static enqueueJob = enqueueExportJob;
  static getJobStatus = getExportJobStatus;
  static claimAndProcess = claimAndProcessExportJob;
  static cancelJob = cancelExportJob;
  static processNextExportJob = processNextExportJob;
  static cleanupExpiredJobs = cleanupExpiredJobs;
}
