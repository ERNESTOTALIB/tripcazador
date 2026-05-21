# iOS Home Screen Widget + Live Activities — Plan

## Overview

Dos features iOS para Premium signature:

1. **Home Screen widget** (small/medium): muestra próximo chollo Premium
   con destino + precio. Refresh hourly.

2. **Live Activity** (Dynamic Island + Lock Screen): cuando un chollo está
   activo y caduca pronto, muestra countdown "Madrid → Tokio · 469€ ·
   caduca en 14min".

## Stack

- **expo-widget-extension** (community package) — requires bare workflow OR custom dev client
- Alternative: **react-native-widgetkit** + native iOS widget via Swift
- Live Activities: requires iOS 16.2+ + ActivityKit native module

## Setup steps (cuando vayamos a publicar)

```bash
# 1. Eject to bare workflow (o usar dev-client)
npx expo prebuild --platform ios

# 2. Add Widget Extension target en Xcode
#    File → New → Target → Widget Extension → "TripCazadorWidget"

# 3. Implement widget en Swift (Sources/TripCazadorWidget/):
#    - DealEntry: TimelineEntry con destination + price
#    - DealProvider: fetchea último deal desde shared App Group
#    - DealWidgetView: SwiftUI vista
```

## Swift widget pseudocode

```swift
struct DealWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "DealWidget", provider: DealProvider()) { entry in
            DealWidgetView(entry: entry)
        }
        .configurationDisplayName("TripCazador Chollo")
        .description("Tu próximo error fare cazado")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct DealEntry: TimelineEntry {
    let date: Date
    let origin: String
    let destination: String
    let priceEur: Int
    let savingsPct: Int?
    let hotUntil: Date?
}

struct DealProvider: TimelineProvider {
    func placeholder(in context: Context) -> DealEntry {
        DealEntry(date: .now, origin: "MAD", destination: "TYO", priceEur: 469, savingsPct: 60, hotUntil: nil)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<DealEntry>) -> ()) {
        // Read shared UserDefaults / App Group
        let userDefaults = UserDefaults(suiteName: "group.com.tripcazador.app")
        // Parse latest deal saved by main app
        // ...
        let timeline = Timeline(entries: [entry], policy: .after(.now + 3600))
        completion(timeline)
    }
}
```

## React Native side

```typescript
// src/lib/widget_data.ts
import { NativeModules } from 'react-native';
const { TripCazadorWidget } = NativeModules;

export async function updateWidget(deal: {
  origin: string;
  destination: string;
  priceEur: number;
  savingsPct?: number;
  hotUntil?: string;
}) {
  if (Platform.OS !== 'ios') return;
  await TripCazadorWidget?.updateData(deal);
}
```

## Live Activities

Más complejo que widgets — requires ActivityKit + push notifications con apns-push-type=liveactivity.

Flow:
1. App user adds deal to watch list → app starts Live Activity
2. ActivityAttributes con startDate + originalPrice + hotUntilDate
3. Lock screen + Dynamic Island muestran countdown
4. Cuando hot_until alcanza 5min, push notification "última oportunidad"

```swift
struct DealActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var currentPrice: Int
        var minutesLeft: Int
    }
    
    var origin: String
    var destination: String
    var bookingUrl: String
}

// Start activity from RN bridge
let attributes = DealActivityAttributes(origin: "MAD", destination: "TYO", bookingUrl: "...")
let activity = try Activity<DealActivityAttributes>.request(
    attributes: attributes,
    contentState: .init(currentPrice: 469, minutesLeft: 60)
)
```

## Effort estimate

- Widget basic (small/medium): **2-3 días** (Swift + RN bridge + dev client)
- Live Activities: **3-5 días** adicional (más complejo, push setup)
- Total iOS-only feature: **1 semana**

## Cuando hacerlo

- Después de aprobar app TestFlight build (necesitas Apple Developer activo)
- Después de tener 100+ usuarios Premium iOS (sino es over-engineering)

## ROI

- Retention Premium iOS: +15-20% según data Tinder/Bumble (live activities)
- Premium upsell push: app shows widget gratis, Live Activity solo Premium
- Brand visibility: home screen presence = aware mind share

## Por ahora (este sesión SSS370)

Documentamos el plan. No tocamos código todavía porque requiere bare workflow + native code que rompe el managed Expo workflow actual.

Cuando llegue el momento: ejecutar `npx expo prebuild --platform ios` y proceder.
