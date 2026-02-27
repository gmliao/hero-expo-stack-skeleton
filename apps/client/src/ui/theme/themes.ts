import { tokens } from './tokens'

/** Light theme aligned with Pencil design: teal primary, orange CTA, #F0FDFA background */
export const lightTheme = {
  background: tokens.color.teal50,
  backgroundSecondary: tokens.color.white,
  color: tokens.color.teal900,
  colorSecondary: tokens.color.teal700,
  borderColor: tokens.color.teal200,
  primary: tokens.color.teal600,
  primaryHover: tokens.color.teal300,
  secondary: tokens.color.teal600,
  action: tokens.color.teal600,
  cta: tokens.color.orange500,
  danger: tokens.color.red500,
  success: tokens.color.green500,
}

export const darkTheme = {
  background: tokens.color.slate900,
  backgroundSecondary: tokens.color.slate800,
  color: tokens.color.slate50,
  colorSecondary: tokens.color.slate200,
  borderColor: tokens.color.slate700,
  primary: tokens.color.teal400,
  primaryHover: tokens.color.teal300,
  secondary: tokens.color.teal500,
  action: tokens.color.teal400,
  cta: tokens.color.orange500,
  danger: tokens.color.red500,
  success: tokens.color.green500,
}
