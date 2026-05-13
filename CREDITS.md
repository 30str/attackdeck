# Credits

## Game design
Gloomhaven, Frosthaven, and Jaws of the Lion are designed by Isaac Childres and published by Cephalofair Games. This app is an unofficial fan-made companion tool and is not affiliated with, endorsed by, or sponsored by Cephalofair.

## Perk and modifier data
Class perk lists and attack-modifier deck composition are adapted from the open-source [Gloomhaven Secretariat](https://github.com/Lurkars/gloomhavensecretariat) project, itself a community fork and continuation of the original Gloomhaven Helper. Data is used under the spirit of Cephalofair's community licensing position on derivative tools.

Per-class source files (in `src/data/classes/`) cite the GHS path they were transcribed from.

## App
- Developed by [30str](https://30str.com)
- React Native + Expo (Expo Router)
- State: Zustand + AsyncStorage
- Engine + UI: hand-written, all under the project's own license
- Animations: react-native-reanimated

## Reporting data errors
Perk data is hand-transcribed from a structured source but transcription errors are possible. If you spot a discrepancy with the printed rulebook, open an issue with the class name, perk number, and what the correct text/effect should be.
