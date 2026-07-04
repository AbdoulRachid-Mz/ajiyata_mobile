 ERROR  Text strings must be rendered within a <Text> component.

Code: button.tsx
  151 |     return (
  152 |       <Animated.View style={[buttonStyles.container, style, animatedStyle] as any}>
> 153 |         <Pressable
      |         ^
  154 |           ref={ref}
  155 |           disabled={disabled}
  156 |           onPressIn={handlePressIn}
Call Stack
  forwardRef$argument_0 (src\components\ui\button.tsx:153:9)
  SettingsScreen (src\app\(tabs)\settings.tsx:794:11)
  TabsLayout (src\app\(tabs)\_layout.tsx:103:5)
  RootLayout (src\app\_layout.tsx:24:21)
 ERROR  Backup error: [FirebaseError: Invalid document reference. Document references must have an even number of segments, but users/UZxnrD3KDeQ6JAntEyHqZosT2X93/categories has 3.] FirebaseError: Invalid document reference. Document references must have an even number of segments, but users/UZxnrD3KDeQ6JAntEyHqZosT2X93/categories has 3.