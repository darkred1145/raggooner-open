# ActiveClassTracker.spec
# -----------------------
# PyInstaller spec for track_active_classes.py
#
# Build with:
#   pyinstaller ActiveClassTracker.spec
#
# Output: dist/ActiveClassTracker.exe
#
# Requirements (install before building):
#   pip install pyinstaller frida
#
# See IL2CppDumper.spec for notes on frida native extension handling.

from PyInstaller.utils.hooks import collect_dynamic_libs, collect_data_files

frida_binaries = collect_dynamic_libs('frida')
frida_datas    = collect_data_files('frida')

block_cipher = None

a = Analysis(
    ['track_active_classes.py'],
    pathex=[],
    binaries=frida_binaries,
    datas=frida_datas,
    hiddenimports=[
        'frida',
        'frida._frida',
        'frida.core',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'unittest',
        'email',
        'html',
        'http',
        'urllib',
        'xml',
        'xmlrpc',
        'multiprocessing',
        'sqlite3',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ActiveClassTracker',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[
        '_frida.pyd',
    ],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
