export function isMaintenanceMode() {
  return process.env.MAINTENANCE_MODE === '1'
}
