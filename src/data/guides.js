export const guideArticles = [
  {
    slug: 'install-apps-flip-phones',
    title: 'How to Install, Uninstall, and Launch Apps on Flip Phones',
    category: 'Guide',
    summary:
      'Step-by-step instructions for installing, uninstalling, and launching Android apps on kosher flip phones using USB debugging, SD cards, or ADB.',
    heroNote: 'Need help? Join the forums where the community can walk you through every hiccup.',
    heroLink: { label: 'Visit the forums', href: 'https://jtechforums.org' },
    sections: [
      {
        title: 'Installing Apps',
        subsections: [
          {
            subtitle: 'Step 1 · Enable USB Debugging',
            description: 'Different devices expose developer options in different ways.',
            variants: [
              {
                label: 'Kyocera & non-LG phones',
                steps: [
                  'Open Settings → Software information.',
                  'Tap Build Number seven times to unlock developer options.',
                  'Return to Settings, open Developer Options, and enable USB Debugging.',
                ],
              },
              {
                label: 'LG Exalt',
                steps: [
                  'Dial ##7764726220.',
                  'Enter 000000 as the service code.',
                  'Navigate to Developer Options → USB Debugging and toggle it on.',
                ],
              },
              {
                label: 'LG Classic Flip & LG Wine 2',
                steps: [
                  'Dial ##228378 and press call.',
                  'Scroll to Developer Options.',
                  'Enable USB Debugging.',
                ],
              },
            ],
          },
          {
            subtitle: 'Step 2 · Install the apps',
            description: 'Choose the method that matches your hardware.',
            variants: [
              {
                label: 'Kyocera',
                body: 'Send the APK over Bluetooth from another device, then tap the notification to install.',
              },
              {
                label: 'LG Exalt',
                body: 'Download the APK from the JTech site, copy it to an SD card, and use File Manager to install.',
              },
              {
                label: 'Most other phones (ADB)',
                body: 'Use ADB from your computer.',
                steps: [
                  'Use the Install APK feature (or `adb install app.apk`).',
                  'Review the “What is ADB?” primer on the forum before running commands.',
                ],
                link: {
                  label: 'ADB getting started',
                  href: 'https://jtechforums.org/t/what-is-adb-and-getting-started/1072',
                },
              },
            ],
          },
          {
            subtitle: 'Advanced · Install via CLI',
            description: 'Power users can install directly with ADB.',
            code: 'adb install -g appname.apk',
            note: 'Replace appname.apk with the file you pushed (e.g., adb install -g waze.apk).',
            link: {
              label: 'ADB reference',
              href: 'https://jtechforums.org/t/what-is-adb-and-getting-started/1072',
            },
          },
        ],
      },
      {
        title: 'Uninstalling Apps',
        subsections: [
          {
            subtitle: 'LG Exalt',
            steps: [
              'Dial ##7764726220 and enter 000000 as the service code.',
              'Open Applications, pick the app, and choose Uninstall.',
            ],
          },
          {
            subtitle: 'All other phones',
            description: 'Use ADB to remove the package.',
            code: 'adb uninstall package_name',
            note: 'Run `pm list packages | grep app_name` to discover the exact package ID before uninstalling.',
            link: {
              label: 'ADB getting started',
              href: 'https://jtechforums.org/t/what-is-adb-and-getting-started/1072',
            },
          },
        ],
      },
      {
        title: 'Launching Installed Apps',
        subsections: [
          {
            subtitle: 'LG Exalt',
            steps: [
              'Dial ##7764726220 and enter 000000.',
              'Open Applications to browse and launch sideloaded apps.',
            ],
          },
          {
            subtitle: 'Other phones',
            description:
              'Install the launcher APK from the JTech downloads list, or replace home-screen shortcuts on certain Kyocera models.',
          },
        ],
      },
      {
        title: 'Go further',
        description: 'Check the Android Guides category on the forum for fresh playbooks and troubleshooting threads.',
        link: { label: 'Android Guides forum', href: 'https://jtechforums.org/c/android-guides/15' },
      },
    ],
  },
  {
    slug: 'cat-s22-verizon-volte',
    title: 'How to Make a CAT S22 Flip Work with Verizon',
    category: 'Advanced guide',
    summary:
      'Unlock Verizon VoLTE on the CAT S22 Flip by installing Qualcomm drivers, editing modem configs, and flashing the Verizon MBN.',
    heroNote: 'This process is advanced and may brick the device. Proceed carefully.',
    heroLink: {
      label: 'Original Reddit walkthrough',
      href: 'https://www.reddit.com/r/dumbphones/comments/1i081bc/working_verizon_volte_on_the_cat_s22_guide/',
    },
    sections: [
      {
        title: 'Requirements',
        subsections: [
          {
            subtitle: 'Software',
            steps: ['QPST v2.7.496.1 (Qualcomm Product Support Tools)', 'Qualcomm USB Drivers', 'Verizon MBN file (mcfg_sw.mbn)'],
          },
          {
            subtitle: 'Hardware',
            steps: ['Network-unlocked CAT S22 (stock Android 11)', 'Windows PC', 'Data-capable USB-C cable'],
          },
        ],
      },
      {
        title: 'Step-by-step instructions',
        subsections: [
          {
            subtitle: 'Install Qualcomm USB drivers',
            steps: ['Download and run setup.exe', 'Reboot your PC after installation'],
          },
          {
            subtitle: 'Install Qualcomm Product Support Tools',
            steps: ['Run the installer', 'Reboot once it finishes'],
          },
          {
            subtitle: 'Prepare the CAT S22',
            steps: [
              'Enable developer options and turn on USB debugging.',
              'Enable OEM unlocking if requested.',
              'Dial *#*#717717#*#* to open the DIAG port.',
            ],
          },
          {
            subtitle: 'Flash the Verizon MBN',
            steps: [
              'Open QPST Configuration and select the COM port created when the DIAG port opened.',
              'Launch QPST Software Download → Start clients → PDC.',
              'Deactivate the default profile, then load the Verizon mcfg_sw.mbn file.',
              'Activate the Verizon profile, reset, and close the DIAG port.',
            ],
          },
          {
            subtitle: 'Final checks',
            steps: ['Restart the CAT S22', 'Confirm that VoLTE stays active and calls complete over LTE'],
          },
        ],
      },
      {
        title: 'Optional fixes',
        subsections: [
          {
            subtitle: 'Force LTE-only mode',
            steps: [
              'Dial *#*#4636#*#*.',
              'Open “Phone information”.',
              'Set Preferred network to LTE only.',
              'Toggle airplane mode or reboot if it does not latch immediately.',
            ],
          },
          {
            subtitle: 'SMS not working',
            description: 'Call Verizon and ask support to flag the line as CDMAless so LTE-only devices receive SMS.',
            link: {
              label: 'Verizon CDMAless PSA',
              href: 'https://reddit.com/r/GooglePixel/comments/qglwf3/psa_unlocked_pixel_6_on_verizon_requires_special/',
            },
          },
        ],
      },
      {
        title: 'Go further',
        description: 'Browse the Android Guides category for fresh community discoveries and safer automation.',
        link: { label: 'Android Guides forum', href: 'https://jtechforums.org/c/android-guides/15' },
      },
    ],
  },
  {
    slug: 'android-auto-cat-s22',
    title: 'Install Android Auto on a CAT S22 Flip',
    category: 'Android guide',
    summary:
      'Run Android Auto on the CAT S22 Flip by flashing the community Magisk module and adjusting permissions—even though Android Go normally blocks it.',
    heroNote: 'Magisk root is required. Remove Android Auto updates before removing the module to avoid bootloops.',
    heroLink: { label: 'Join the forums for root help', href: 'https://jtechforums.org' },
    sections: [
      {
        title: 'Requirements',
        description: 'Prep the device before flashing.',
        steps: [
          'Magisk must already be installed on the phone.',
          'Download the Android Auto Magisk Module ZIP to local storage.',
        ],
        link: {
          label: 'Magisk module download',
          href: 'https://drive.google.com/file/d/1if8SXcsyASUqxuCKc30ntBnaBTNzTHcF/view?usp=sharing',
        },
      },
      {
        title: 'Step 1 · Install the module',
        steps: [
          'Open Magisk → Modules → Install from Storage.',
          'Select the Android Auto module ZIP.',
          'Wait for flashing to finish and tap Reboot.',
        ],
      },
      {
        title: 'Step 2 · Enable Android Auto',
        steps: [
          'Update Android Auto from the Play Store.',
          'Settings → Apps → See All → Android Auto → Permissions → allow everything.',
          'Settings → Apps → Special App Access → Notification Access → enable Android Auto.',
        ],
      },
      {
        title: 'Before removing the module',
        description:
          'Open the Play Store, locate Android Auto, and uninstall updates before removing the Magisk module to avoid a bootloop. Afterwards, remove the module from Magisk → Modules.',
      },
      {
        title: 'Go further',
        description: 'More Android automation tricks live inside the Android Guides forum category.',
        link: { label: 'Android Guides forum', href: 'https://jtechforums.org/c/android-guides/15' },
      },
    ],
  },
];
