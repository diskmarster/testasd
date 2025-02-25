import { cn } from '@/lib/utils'
import {
  ArrowDown,
  TrafficCone,
  Zap,
  ChevronRight,
  ArrowDownUp,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Boxes,
  Calendar,
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronsUpDownIcon,
  CircleAlert,
  Columns2,
  Diff,
  Download,
  Ellipsis,
  ExternalLink,
  HousePlus,
  Infinity,
  List,
  Loader2,
  Mail,
  Menu,
  Minus,
  Moon,
  Plus,
  Printer,
  RefreshCcw,
  Settings,
  Star,
  Sun,
  Trash,
  Type,
  UserRoundPlus,
  Warehouse,
  X,
  ListTodo,
  Sheet,
  CloudUpload,
  TriangleAlert,
  Copy,
  Monitor,
  Smartphone,
  CircleDollarSign,
  Ban,
  Hash,
  CircleHelp,
  FileText,
  EllipsisIcon,
  CalendarClock,
  PackageCheck,
  PackagePlusIcon,
  PackageXIcon,
  PackageIcon,
  SquarePlus,
  SquareSlash,
} from 'lucide-react'

export const Icons = {
	squareSlash: SquareSlash,
	squarePlus: SquarePlus,
	zap: Zap,
	calendarClock: CalendarClock,
	ellipsis: EllipsisIcon,
  updown: ChevronsUpDown,
  packagePlus: PackagePlusIcon,
  packageCross: PackageXIcon,
  packageCheck: PackageCheck,
  package: PackageIcon,
  filetext: FileText,
  help: CircleHelp,
  hash: Hash,
  copy: Copy,
  chevronRight: ChevronRight,
  triangleAlert: TriangleAlert,
  sheet: Sheet,
  cloudUpload: CloudUpload,
  listTodo: ListTodo,
  housePlus: HousePlus,
  trafficCone: TrafficCone,
  arrowDownUp: ArrowDownUp,
  userPlus: UserRoundPlus,
  arrowLeftRight: ArrowLeftRight,
  chevronDownUp: ChevronsUpDownIcon,
  diff: Diff,
  minus: Minus,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  columns: Columns2,
  printer: Printer,
  calendar: Calendar,
  list: List,
  text: Type,
  cross: X,
  trash: Trash,
  download: Download,
  horizontalDots: Ellipsis,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  plus: Plus,
  star: Star,
  sun: Sun,
  moon: Moon,
  chevronDown: ChevronDown,
  alert: CircleAlert,
  spinner: Loader2,
  warehouse: Warehouse,
  external: ExternalLink,
  menu: Menu,
  mail: Mail,
  boxes: Boxes,
  check: Check,
  infinity: Infinity,
  refresh: RefreshCcw,
  settings: Settings,
  monitor: Monitor,
  bannedMonitor: ({ sizeClass: className }: { sizeClass?: string }) => (
    <div className={cn('relative overflow-none size-4')}>
      <Monitor className={cn('absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2', className)} />
      <Ban className={cn('size-4 absolute text-destructive top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2')} />
    </div>
  ),
  smartphone: Smartphone,
  bannedSmartphone: ({ sizeClass: className }: { sizeClass?: string }) => (
    <div className={cn('relative overflow-none size-4')}>
      <Smartphone className={cn('absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2', className)} />
      <Ban className={cn('size-4 absolute text-destructive top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2')} />
    </div>
  ),
  dollarSign: CircleDollarSign,
  ban: Ban,

  plusMinus: ({ ...props }) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}>
      <path stroke='none' d='M0 0h24v24H0z' fill='none' />
      <path d='M4 7h6' />
      <path d='M7 4v6' />
      <path d='M20 18h-6' />
      <path d='M5 19l14 -14' />
    </svg>
  ),
  replace: ({ ...props }) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}>
      <path stroke='none' d='M0 0h24v24H0z' fill='none' />
      <path d='M3 3m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z' />
      <path d='M15 15m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z' />
      <path d='M21 11v-3a2 2 0 0 0 -2 -2h-6l3 3m0 -6l-3 3' />
      <path d='M3 13v3a2 2 0 0 0 2 2h6l-3 -3m0 6l3 -3' />
    </svg>
  ),
  gridPlus: ({ ...props }) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}>
      <path stroke='none' d='M0 0h24v24H0z' fill='none' />
      <path d='M4 4h6v6h-6zm10 0h6v6h-6zm-10 10h6v6h-6zm10 3h6m-3 -3v6' />
    </svg>
  ),
}
