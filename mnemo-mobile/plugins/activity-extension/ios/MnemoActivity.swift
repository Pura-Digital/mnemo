import UIKit
import ActivityKit
import AppIntents
import WidgetKit
import SwiftUI

// MARK: - Brand mark

private let mnemoBrandImage = makeMnemoBrandImage()

struct BrandMark: View {
  var color: Color = .white

  var body: some View {
    Image(uiImage: mnemoBrandImage)
      .resizable()
      .scaledToFit()
  }
}

struct BrandBadge: View {
  var size: CGFloat

  var body: some View {
    BrandMark()
      .frame(width: size, height: size)
  }
}

struct ElapsedText: View {
  let startedAt: Date
  var color: Color = .white

  var body: some View {
    Text(timerInterval: startedAt...startedAt.addingTimeInterval(60 * 60 * 24), countsDown: false)
      .monospacedDigit()
      .font(.system(size: 15, weight: .semibold))
      .foregroundColor(color)
  }
}

// MARK: - Power button (turn dictation mode off)

struct PowerButton: View {
  var size: CGFloat = 30

  var body: some View {
    if #available(iOS 17.0, *) {
      Button(intent: ToggleDictationModeIntent()) {
        glyph
      }
      .buttonStyle(.plain)
    } else {
      glyph
    }
  }

  private var glyph: some View {
    Image(systemName: "power")
      .font(.system(size: size * 0.62, weight: .semibold))
      .foregroundColor(.white)
      .frame(width: size, height: size)
      .background(Circle().fill(Color.white.opacity(0.16)))
  }
}

// MARK: - Lock screen / banner

struct RecordingLockScreenView: View {
  let state: RecordingActivityAttributes.ContentState

  var body: some View {
    HStack(spacing: 12) {
      BrandBadge(size: 40)
      VStack(alignment: .leading, spacing: 2) {
        Text("mnemo")
          .font(.system(size: 15, weight: .semibold))
          .foregroundColor(.white)
        if state.phase == .recording {
          HStack(spacing: 5) {
            Circle()
              .fill(Color(red: 1.0, green: 0.27, blue: 0.23))
              .frame(width: 7, height: 7)
            Text("Recording")
              .font(.system(size: 13))
              .foregroundColor(.white.opacity(0.6))
          }
        } else {
          Text("Dictation mode is active")
            .font(.system(size: 13))
            .foregroundColor(.white.opacity(0.6))
        }
      }
      Spacer()
      if state.phase == .recording {
        ElapsedText(startedAt: state.startedAt, color: .white.opacity(0.85))
      }
      PowerButton(size: 34)
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 12)
  }
}

// MARK: - Widget

@main
struct MnemoActivityBundle: WidgetBundle {
  var body: some Widget {
    RecordingLiveActivity()
  }
}

struct RecordingLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: RecordingActivityAttributes.self) { context in
      RecordingLockScreenView(state: context.state)
        .activityBackgroundTint(Color.black.opacity(0.6))
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 10) {
            BrandBadge(size: 34)
            VStack(alignment: .leading, spacing: 1) {
              Text("mnemo")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
              Text(context.state.phase == .recording ? "Recording" : "Active")
                .font(.system(size: 12))
                .foregroundColor(.white.opacity(0.6))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            }
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          HStack(spacing: 8) {
            if context.state.phase == .recording {
              ElapsedText(startedAt: context.state.startedAt, color: .white.opacity(0.7))
            }
            PowerButton(size: 30)
          }
        }
      } compactLeading: {
        BrandBadge(size: 22)
      } compactTrailing: {
        if context.state.phase == .recording {
          ElapsedText(startedAt: context.state.startedAt)
            .frame(maxWidth: 44)
        }
      } minimal: {
        BrandBadge(size: 22)
      }
      .keylineTint(Color(red: 0.141, green: 0.341, blue: 0.839))
    }
  }
}

// BEGIN GENERATED MNEMO MARK — scripts/generate-brand-assets.py
private func makeMnemoBrandImage(size: CGFloat = 120) -> UIImage {
  UIGraphicsImageRenderer(size: CGSize(width: size, height: size)).image { renderer in
    let context = renderer.cgContext
    let scale = size / max(524.0, 592.0)
    context.translateBy(x: (size - 524.0 * scale) / 2, y: (size - 592.0 * scale) / 2)
    context.scaleBy(x: scale, y: scale)
    let p0 = UIBezierPath()
    p0.move(to: CGPoint(x: 522.953, y: 176.981))
    p0.addCurve(to: CGPoint(x: 523.588, y: 218.568), controlPoint1: CGPoint(x: 524.25, y: 189.972), controlPoint2: CGPoint(x: 523.622, y: 203.607))
    p0.addLine(to: CGPoint(x: 523.445, y: 294.335))
    p0.addLine(to: CGPoint(x: 523.51, y: 371.312))
    p0.addCurve(to: CGPoint(x: 507.038, y: 453.392), controlPoint1: CGPoint(x: 523.541, y: 401.242), controlPoint2: CGPoint(x: 526.494, y: 428.121))
    p0.addCurve(to: CGPoint(x: 450.172, y: 494.309), controlPoint1: CGPoint(x: 492.184, y: 472.684), controlPoint2: CGPoint(x: 470.757, y: 482.479))
    p0.addLine(to: CGPoint(x: 388.119, y: 530.268))
    p0.addLine(to: CGPoint(x: 332.068, y: 563.266))
    p0.addCurve(to: CGPoint(x: 269.719, y: 590.613), controlPoint1: CGPoint(x: 310.781, y: 575.855), controlPoint2: CGPoint(x: 294.886, y: 587.427))
    p0.addCurve(to: CGPoint(x: 175.124, y: 558.144), controlPoint1: CGPoint(x: 227.877, y: 595.196), controlPoint2: CGPoint(x: 208.524, y: 578.866))
    p0.addLine(to: CGPoint(x: 114.085, y: 520.599))
    p0.addLine(to: CGPoint(x: 65.7061, y: 491.169))
    p0.addCurve(to: CGPoint(x: 34.083, y: 471.325), controlPoint1: CGPoint(x: 55.0067, y: 484.737), controlPoint2: CGPoint(x: 44.0851, y: 478.814))
    p0.addCurve(to: CGPoint(x: 0.458008, y: 401.861), controlPoint1: CGPoint(x: 7.68817, y: 451.565), controlPoint2: CGPoint(x: 1.72768, y: 428.622))
    p0.addLine(to: CGPoint(x: 67.4824, y: 492.177))
    p0.addLine(to: CGPoint(x: 147.139, y: 540.713))
    p0.addLine(to: CGPoint(x: 352.27, y: 540.713))
    p0.addLine(to: CGPoint(x: 489.74, y: 468.853))
    p0.addLine(to: CGPoint(x: 509.057, y: 444.042))
    p0.addLine(to: CGPoint(x: 520.855, y: 415.199))
    p0.addLine(to: CGPoint(x: 522.953, y: 176.981))
    p0.close()
    p0.move(to: CGPoint(x: 271.246, y: 112.826))
    p0.addCurve(to: CGPoint(x: 299.841, y: 116.415), controlPoint1: CGPoint(x: 281.913, y: 112.038), controlPoint2: CGPoint(x: 289.729, y: 112.362))
    p0.addCurve(to: CGPoint(x: 331.86, y: 150.55), controlPoint1: CGPoint(x: 314.969, y: 122.597), controlPoint2: CGPoint(x: 326.658, y: 135.057))
    p0.addCurve(to: CGPoint(x: 334.57, y: 199.505), controlPoint1: CGPoint(x: 335.756, y: 162.345), controlPoint2: CGPoint(x: 334.593, y: 186.221))
    p0.addLine(to: CGPoint(x: 334.372, y: 301.366))
    p0.addCurve(to: CGPoint(x: 334.36, y: 347.627), controlPoint1: CGPoint(x: 334.343, y: 316.789), controlPoint2: CGPoint(x: 334.285, y: 332.082))
    p0.addCurve(to: CGPoint(x: 356.163, y: 388.35), controlPoint1: CGPoint(x: 334.44, y: 364.25), controlPoint2: CGPoint(x: 339.833, y: 380.869))
    p0.addCurve(to: CGPoint(x: 368.025, y: 382.489), controlPoint1: CGPoint(x: 360.627, y: 390.395), controlPoint2: CGPoint(x: 367.352, y: 388.037))
    p0.addCurve(to: CGPoint(x: 368.708, y: 350.454), controlPoint1: CGPoint(x: 369.295, y: 372.029), controlPoint2: CGPoint(x: 368.751, y: 361.062))
    p0.addLine(to: CGPoint(x: 368.597, y: 275.85))
    p0.addCurve(to: CGPoint(x: 374.479, y: 216.112), controlPoint1: CGPoint(x: 368.588, y: 260.066), controlPoint2: CGPoint(x: 366.19, y: 228.727))
    p0.addCurve(to: CGPoint(x: 497.464, y: 241.013), controlPoint1: CGPoint(x: 406.169, y: 167.887), controlPoint2: CGPoint(x: 464.562, y: 220.805))
    p0.addCurve(to: CGPoint(x: 518.336, y: 338.534), controlPoint1: CGPoint(x: 527.126, y: 259.231), controlPoint2: CGPoint(x: 516.333, y: 310.277))
    p0.addCurve(to: CGPoint(x: 517.975, y: 410.866), controlPoint1: CGPoint(x: 518.798, y: 358.956), controlPoint2: CGPoint(x: 519.432, y: 390.005))
    p0.addCurve(to: CGPoint(x: 515.54, y: 424.243), controlPoint1: CGPoint(x: 517.658, y: 415.401), controlPoint2: CGPoint(x: 516.841, y: 419.887))
    p0.addCurve(to: CGPoint(x: 467.244, y: 478.013), controlPoint1: CGPoint(x: 507.573, y: 451.78), controlPoint2: CGPoint(x: 491.046, y: 464.823))
    p0.addCurve(to: CGPoint(x: 466.963, y: 347.023), controlPoint1: CGPoint(x: 469.326, y: 435.575), controlPoint2: CGPoint(x: 466.142, y: 389.722))
    p0.addCurve(to: CGPoint(x: 425.09, y: 313.055), controlPoint1: CGPoint(x: 467.315, y: 328.734), controlPoint2: CGPoint(x: 442.899, y: 309.739))
    p0.addCurve(to: CGPoint(x: 406.426, y: 352.717), controlPoint1: CGPoint(x: 404.378, y: 316.914), controlPoint2: CGPoint(x: 406.072, y: 336.365))
    p0.addCurve(to: CGPoint(x: 405.373, y: 430.41), controlPoint1: CGPoint(x: 404.892, y: 374.983), controlPoint2: CGPoint(x: 409.787, y: 409.473))
    p0.addCurve(to: CGPoint(x: 395.848, y: 451.478), controlPoint1: CGPoint(x: 403.789, y: 438.048), controlPoint2: CGPoint(x: 400.536, y: 445.243))
    p0.addCurve(to: CGPoint(x: 364.724, y: 470.076), controlPoint1: CGPoint(x: 388.318, y: 461.415), controlPoint2: CGPoint(x: 377.153, y: 468.415))
    p0.addCurve(to: CGPoint(x: 341.773, y: 468.071), controlPoint1: CGPoint(x: 357.019, y: 471.102), controlPoint2: CGPoint(x: 349.184, y: 470.418))
    p0.addCurve(to: CGPoint(x: 273.457, y: 426.852), controlPoint1: CGPoint(x: 325.63, y: 463.056), controlPoint2: CGPoint(x: 287.724, y: 437.727))
    p0.addCurve(to: CGPoint(x: 250.465, y: 376.641), controlPoint1: CGPoint(x: 257.509, y: 414.488), controlPoint2: CGPoint(x: 250.099, y: 396.279))
    p0.addCurve(to: CGPoint(x: 250.457, y: 331.919), controlPoint1: CGPoint(x: 250.74, y: 361.829), controlPoint2: CGPoint(x: 250.453, y: 346.748))
    p0.addLine(to: CGPoint(x: 250.507, y: 225.137))
    p0.addCurve(to: CGPoint(x: 248.247, y: 182.373), controlPoint1: CGPoint(x: 250.512, y: 211.867), controlPoint2: CGPoint(x: 251.942, y: 194.636))
    p0.addCurve(to: CGPoint(x: 183.312, y: 181.422), controlPoint1: CGPoint(x: 237.786, y: 147.649), controlPoint2: CGPoint(x: 192.455, y: 143.506))
    p0.addCurve(to: CGPoint(x: 181.584, y: 230.45), controlPoint1: CGPoint(x: 180.121, y: 194.653), controlPoint2: CGPoint(x: 181.568, y: 216.864))
    p0.addLine(to: CGPoint(x: 181.405, y: 340.955))
    p0.addCurve(to: CGPoint(x: 181.178, y: 391.595), controlPoint1: CGPoint(x: 181.348, y: 357.437), controlPoint2: CGPoint(x: 181.988, y: 375.297))
    p0.addCurve(to: CGPoint(x: 124.681, y: 424.215), controlPoint1: CGPoint(x: 179.029, y: 420.388), controlPoint2: CGPoint(x: 149.82, y: 438.4))
    p0.addCurve(to: CGPoint(x: 100.694, y: 326.117), controlPoint1: CGPoint(x: 87.975, y: 403.504), controlPoint2: CGPoint(x: 108.906, y: 357.757))
    p0.addCurve(to: CGPoint(x: 49.5596, y: 330.486), controlPoint1: CGPoint(x: 94.098, y: 300.701), controlPoint2: CGPoint(x: 62.1675, y: 321.964))
    p0.addCurve(to: CGPoint(x: 5.2666, y: 372.163), controlPoint1: CGPoint(x: 28.645, y: 344.622), controlPoint2: CGPoint(x: 16.2518, y: 347.639))
    p0.addCurve(to: CGPoint(x: 5.44141, y: 284.921), controlPoint1: CGPoint(x: 6.90975, y: 344.708), controlPoint2: CGPoint(x: 4.9494, y: 312.784))
    p0.addCurve(to: CGPoint(x: 34.0547, y: 211.423), controlPoint1: CGPoint(x: 6.06677, y: 249.468), controlPoint2: CGPoint(x: 1.57729, y: 234.102))
    p0.addCurve(to: CGPoint(x: 121.088, y: 218.96), controlPoint1: CGPoint(x: 67.4333, y: 188.115), controlPoint2: CGPoint(x: 90.1373, y: 199.684))
    p0.addCurve(to: CGPoint(x: 156.979, y: 241.805), controlPoint1: CGPoint(x: 133.161, y: 226.401), controlPoint2: CGPoint(x: 145.126, y: 234.017))
    p0.addCurve(to: CGPoint(x: 172.586, y: 249.217), controlPoint1: CGPoint(x: 160.74, y: 244.29), controlPoint2: CGPoint(x: 168.377, y: 250.2))
    p0.addCurve(to: CGPoint(x: 174.562, y: 239.411), controlPoint1: CGPoint(x: 175.366, y: 248.568), controlPoint2: CGPoint(x: 174.461, y: 241.756))
    p0.addCurve(to: CGPoint(x: 183.615, y: 162.892), controlPoint1: CGPoint(x: 175.658, y: 215.696), controlPoint2: CGPoint(x: 169.424, y: 183.4))
    p0.addCurve(to: CGPoint(x: 228.09, y: 132.818), controlPoint1: CGPoint(x: 191.294, y: 151.796), controlPoint2: CGPoint(x: 216.094, y: 140.41))
    p0.addCurve(to: CGPoint(x: 271.246, y: 112.826), controlPoint1: CGPoint(x: 242.2, y: 123.888), controlPoint2: CGPoint(x: 254.716, y: 115.907))
    p0.close()
    p0.move(to: CGPoint(x: 0.280273, y: 189.838))
    p0.addCurve(to: CGPoint(x: 0.138672, y: 227.299), controlPoint1: CGPoint(x: -0.244725, y: 202.408), controlPoint2: CGPoint(x: 0.127831, y: 216.712))
    p0.addLine(to: CGPoint(x: 0.24707, y: 311.326))
    p0.addLine(to: CGPoint(x: 0.168945, y: 373.78))
    p0.addCurve(to: CGPoint(x: 0.458008, y: 401.861), controlPoint1: CGPoint(x: 0.13319, y: 383.581), controlPoint2: CGPoint(x: 0.0344377, y: 392.933))
    p0.addLine(to: CGPoint(x: 0, y: 401.243))
    p0.addLine(to: CGPoint(x: 0, y: 190.154))
    p0.addLine(to: CGPoint(x: 0.280273, y: 189.838))
    p0.close()
    p0.move(to: CGPoint(x: 256.271, y: 1.15))
    p0.addCurve(to: CGPoint(x: 346.664, y: 30.3932), controlPoint1: CGPoint(x: 289.08, y: -4.98946), controlPoint2: CGPoint(x: 320.029, y: 14.7131))
    p0.addLine(to: CGPoint(x: 407.684, y: 66.3502))
    p0.addLine(to: CGPoint(x: 457.623, y: 95.5621))
    p0.addCurve(to: CGPoint(x: 504.712, y: 130.655), controlPoint1: CGPoint(x: 476.412, y: 106.545), controlPoint2: CGPoint(x: 490.871, y: 113.185))
    p0.addCurve(to: CGPoint(x: 522.533, y: 173.324), controlPoint1: CGPoint(x: 515.916, y: 144.796), controlPoint2: CGPoint(x: 520.621, y: 158.686))
    p0.addLine(to: CGPoint(x: 434.566, y: 84.107))
    p0.addLine(to: CGPoint(x: 94.6494, y: 84.107))
    p0.addLine(to: CGPoint(x: 0.280273, y: 189.838))
    p0.addCurve(to: CGPoint(x: 1.71289, y: 174.027), controlPoint1: CGPoint(x: 0.523501, y: 184.015), controlPoint2: CGPoint(x: 0.959314, y: 178.564))
    p0.addCurve(to: CGPoint(x: 19.6602, y: 132.95), controlPoint1: CGPoint(x: 4.10665, y: 159.032), controlPoint2: CGPoint(x: 10.2844, y: 144.894))
    p0.addCurve(to: CGPoint(x: 73.3691, y: 94.6246), controlPoint1: CGPoint(x: 33.9648, y: 114.601), controlPoint2: CGPoint(x: 53.5329, y: 105.807))
    p0.addLine(to: CGPoint(x: 131.085, y: 62.0084))
    p0.addLine(to: CGPoint(x: 190.117, y: 28.5572))
    p0.addCurve(to: CGPoint(x: 256.271, y: 1.15), controlPoint1: CGPoint(x: 213.883, y: 15.111), controlPoint2: CGPoint(x: 228.533, y: 4.57154))
    p0.close()
    p0.move(to: CGPoint(x: 522.981, y: 173.779))
    p0.addLine(to: CGPoint(x: 522.953, y: 176.981))
    p0.addCurve(to: CGPoint(x: 522.533, y: 173.324), controlPoint1: CGPoint(x: 522.831, y: 175.756), controlPoint2: CGPoint(x: 522.692, y: 174.538))
    p0.addLine(to: CGPoint(x: 522.981, y: 173.779))
    p0.close()
    context.saveGState()
    p0.addClip()
    let g0 = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: [UIColor(red: 1.00000, green: 0.76471, blue: 0.67059, alpha: 1).cgColor, UIColor(red: 1.00000, green: 0.58431, blue: 0.49412, alpha: 1).cgColor, UIColor(red: 0.99608, green: 0.32157, blue: 0.37647, alpha: 1).cgColor, UIColor(red: 0.95686, green: 0.07843, blue: 0.28235, alpha: 1).cgColor, UIColor(red: 0.73725, green: 0.00000, blue: 0.17255, alpha: 1).cgColor] as CFArray, locations: [0.0, 0.28, 0.59, 0.82, 1.0])!
    context.drawLinearGradient(g0, start: CGPoint(x: 52.3771, y: -4.40619e-06), end: CGPoint(x: 508.087, y: 538.139), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
    context.restoreGState()
  }
}
// END GENERATED MNEMO MARK
