#!/bin/zsh
set -euo pipefail

script_dir="${0:A:h}"
project_dir="${script_dir:h}"
app_path="${project_dir}/src-tauri/target/release/bundle/macos/PlotSift.app"
dmg_dir="${project_dir}/src-tauri/target/release/bundle/dmg"
dmg_path="${dmg_dir}/PlotSift_0.1.0_aarch64.dmg"
stage_dir="$(mktemp -d /tmp/plotsift-dmg.XXXXXX)"

cleanup() {
  rm -rf "${stage_dir}"
}
trap cleanup EXIT

cd "${project_dir}"
npm run standalone:build

mkdir -p "${dmg_dir}"
cp -R "${app_path}" "${stage_dir}/PlotSift.app"
ln -s /Applications "${stage_dir}/Applications"

hdiutil create \
  -volname "PlotSift" \
  -srcfolder "${stage_dir}" \
  -ov \
  -format UDZO \
  "${dmg_path}"

echo "Created ${dmg_path}"
