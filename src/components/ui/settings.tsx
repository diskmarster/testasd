import { cn } from "@/lib/utils"
import { HTMLProps } from "react"


export function Setting({
  className,
  children,
  ...props
}: HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col', className)} {...props}>
      {children}
    </div>
  )
}

export function SettingLabel({
  className,
  children,
  ...props
}: HTMLProps<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col flex-1 justify-start py-4', className)}
      {...props}>
      {children}
    </div>
  )
}

export function SettingTitle({
  className,
  children,
  ...props
}: HTMLProps<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-semibold tracking-tight', className)} {...props}>
      {children}
    </h3>
  )
}

export function SettingDescription({
  className,
  children,
  ...props
}: HTMLProps<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-muted-foreground text-pretty', className)}
      {...props}>
      {children}
    </p>
  )
}

export function SettingContent({
  className,
  children,
  ...props
}: HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('flex justify-end p-4 ps-0', className)} {...props}>
      {children}
    </div>
  )
}

export function SettingBody({
  className,
  children,
  ...props
}: HTMLProps<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between', className)}
      {...props}>
      {children}
    </div>
  )
}

export function SettingFooter({
  className,
  children,
  ...props
}: HTMLProps<HTMLDivElement>) {
  return (
    <div className={cn('flex p-4 pt-0', className)} {...props}>
      {children}
    </div>
  )
}
