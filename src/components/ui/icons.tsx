import {
  ArrowDown,
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
  Star,
  Sun,
  Trash,
  Type,
  UserRoundPlus,
  Warehouse,
  X,
  ListTodo,
  Sheet,
  CloudUpload
} from 'lucide-react'

export const Icons = {
  updown: ChevronsUpDown,
  sheet: Sheet,
  cloudUpload: CloudUpload,
  lisTodo: ListTodo,
  housePlus: HousePlus,
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
