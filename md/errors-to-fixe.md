 ERROR  [TypeError: undefined is not a function]

Code: dashboard.tsx
  86 |
  87 |       return () =>
> 88 |         BackHandler.removeEventListener('hardwareBackPress', onBackPress);
     |                                        ^
  89 |     }, [])
  90 |   );
  91 |
Call Stack
  <anonymous> (src\app\(tabs)\dashboard.tsx:88:40)

Code: _layout.tsx
  103 |
  104 |   return (
> 105 |     <Tabs
      |     ^
  106 |       tabBar={(props) => <CustomTabBar {...props} />}
  107 |       screenOptions={{
  108 |         headerShown: false,
Call Stack
  TabsLayout (src\app\(tabs)\_layout.tsx:105:5)
  RootLayout (src\app\_layout.tsx:28:21)
 ERROR  [TypeError: undefined is not a function]

Code: dashboard.tsx
  86 |
  87 |       return () =>
> 88 |         BackHandler.removeEventListener('hardwareBackPress', onBackPress);
     |                                        ^
  89 |     }, [])
  90 |   );
  91 |
Call Stack
  <anonymous> (src\app\(tabs)\dashboard.tsx:88:40)
    at Dashboard(./(tabs)/dashboard.tsx) (<anonymous>)