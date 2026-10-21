#!/usr/bin/env python3
"""Render mnemo's vector master into desktop and mobile packaging assets.
Requires cairosvg and Pillow. No network or screenshot dependency.
"""
from pathlib import Path
from io import BytesIO
import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'src/assets'
svg = (ASSETS / 'logo.svg').read_bytes()
rendered = Image.open(BytesIO(cairosvg.svg2png(bytestring=svg, output_width=1024))).convert('RGBA')
icon = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
fit = min(1024 / rendered.width, 1024 / rendered.height)
fitted = rendered.resize((int(rendered.width * fit), int(rendered.height * fit)), Image.Resampling.LANCZOS)
icon.paste(fitted, ((1024 - fitted.width) // 2, (1024 - fitted.height) // 2), fitted)
icon.save(ASSETS / 'icon.png')
icon.save(ASSETS / 'icon.icns', format='ICNS')
icon.save(ASSETS / 'icon.ico', format='ICO', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
icon.save(ASSETS / 'mnemo.icon/Assets/ICON.png')
# Use the mono ribbon silhouette, not an opaque hexagon, in the macOS tray.
mono_svg = (ASSETS / 'logo-mono.svg').read_bytes()
cairosvg.svg2png(bytestring=mono_svg, output_width=54, output_height=54,
                write_to=str(ASSETS / 'iconTemplate@3x.png'))
mobile = ROOT / 'mnemo-mobile/assets'
# Opaque square launcher tile, with the full hexagon inside Android's safe area.
tile = Image.new('RGBA',(1024,1024),'#FFFFFF')
tile.alpha_composite(icon)
tile.convert('RGB').save(mobile / 'icon.png')
icon.resize((768,768),Image.Resampling.LANCZOS).save(mobile / 'splash-icon.png')
adaptive = Image.new('RGBA',(1024,1024))
small = icon.resize((640,640),Image.Resampling.LANCZOS)
adaptive.alpha_composite(small,(192,192))
adaptive.save(mobile / 'adaptive-icon.png')
icon.resize((64,64),Image.Resampling.LANCZOS).save(mobile / 'favicon.png')
archiveye_svg = (ASSETS / 'logo-ae.svg').read_bytes()
archiveye = Image.open(
    BytesIO(cairosvg.svg2png(bytestring=archiveye_svg, output_width=144))
).convert('RGBA')
archiveye.save(mobile / 'logo-ae.png')
print('Rendered mnemo assets for macOS, Windows, Linux, iOS and Android.')

# Generate the same vector for the native iOS extensions without asset-catalog
# coupling. Delimited blocks are regenerated from the SVG master above.
import re
import xml.etree.ElementTree as ET
ns = {'svg': 'http://www.w3.org/2000/svg'}
tree = ET.fromstring(svg)
view_box = tree.attrib.get('viewBox', '0 0 600 600').split()
vb_w, vb_h = float(view_box[2]), float(view_box[3])
gradients = {}
for gradient in tree.findall('svg:defs/svg:linearGradient', ns):
    stops = gradient.findall('svg:stop', ns)
    gradients[gradient.attrib['id']] = (gradient.attrib, stops)

def color(hex_color):
    channels = [int(hex_color[i:i+2], 16) / 255 for i in (1,3,5)]
    return 'UIColor(red: %.5f, green: %.5f, blue: %.5f, alpha: 1)' % tuple(channels)

lines = ['// BEGIN GENERATED MNEMO MARK — scripts/generate-brand-assets.py',
         'private func makeMnemoBrandImage(size: CGFloat = 120) -> UIImage {',
         '  UIGraphicsImageRenderer(size: CGSize(width: size, height: size)).image { renderer in',
         '    let context = renderer.cgContext',
         f'    let scale = size / max({vb_w}, {vb_h})',
         f'    context.translateBy(x: (size - {vb_w} * scale) / 2, y: (size - {vb_h} * scale) / 2)',
         '    context.scaleBy(x: scale, y: scale)']
for index, element in enumerate(tree.findall('svg:path', ns)):
    fill = element.attrib.get('fill', '')
    if not fill.startswith('url(#'):
        continue
    name = f'p{index}'
    lines.append(f'    let {name} = UIBezierPath()')
    tokens = re.findall(r'[MLCQVHZ]|-?\d+(?:\.\d+)?', element.attrib['d'])
    pos = 0; x = y = 0
    while pos < len(tokens):
        command = tokens[pos]; pos += 1
        count = {'M':2,'L':2,'Q':4,'C':6,'V':1,'H':1,'Z':0}[command]
        args = tokens[pos:pos+count]; pos += count
        if command in ('M','L'):
            x,y = args
            method = 'move' if command == 'M' else 'addLine'
            lines.append(f'    {name}.{method}(to: CGPoint(x: {x}, y: {y}))')
        elif command == 'Q':
            cx,cy,x,y = args
            lines.append(f'    {name}.addQuadCurve(to: CGPoint(x: {x}, y: {y}), controlPoint: CGPoint(x: {cx}, y: {cy}))')
        elif command == 'C':
            x1,y1,x2,y2,x,y = args
            lines.append(
                f'    {name}.addCurve(to: CGPoint(x: {x}, y: {y}), controlPoint1: CGPoint(x: {x1}, y: {y1}), controlPoint2: CGPoint(x: {x2}, y: {y2}))'
            )
        elif command == 'V':
            y = args[0]; lines.append(f'    {name}.addLine(to: CGPoint(x: {x}, y: {y}))')
        elif command == 'H':
            x = args[0]; lines.append(f'    {name}.addLine(to: CGPoint(x: {x}, y: {y}))')
        else: lines.append(f'    {name}.close()')
    gradient_id = fill[5:-1]
    attrs, stops = gradients[gradient_id]
    colours = ', '.join(color(stop.attrib['stop-color'])+'.cgColor' for stop in stops)
    positions = ', '.join(str(float(stop.attrib.get('offset','0'))) for stop in stops)
    lines += ['    context.saveGState()',f'    {name}.addClip()',
              f'    let g{index} = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: [{colours}] as CFArray, locations: [{positions}])!',
              f'    context.drawLinearGradient(g{index}, start: CGPoint(x: {attrs["x1"]}, y: {attrs["y1"]}), end: CGPoint(x: {attrs["x2"]}, y: {attrs["y2"]}), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])',
              '    context.restoreGState()']
lines += ['  }', '}', '// END GENERATED MNEMO MARK']
block = '\n'.join(lines)+'\n'
for relative in ['plugins/keyboard-extension/ios/KeyboardViewController.swift',
                 'plugins/activity-extension/ios/MnemoActivity.swift']:
    file = ROOT/'mnemo-mobile'/relative
    source = file.read_text()
    source = re.sub(r'// BEGIN GENERATED MNEMO MARK.*?// END GENERATED MNEMO MARK\n?', '', source, flags=re.S)
    file.write_text(source.rstrip()+'\n\n'+block)
