# IL2CppDumper.spec
# -----------------
# PyInstaller spec for dump_il2cpp_classes.py
#
# Build with:
#   pyinstaller IL2CppDumper.spec
#
# Output: dist/IL2CppDumper.exe
#
# Requirements (install before building):
#   pip install pyinstaller frida
#
# Notes
# -----
# frida ships a native extension (_frida.pyd on Windows).  PyInstaller does
# not auto-discover it, so it is listed explicitly in hiddenimports and its
# binary is collected via collect_dynamic_libs / collect_all.
# If the build fails to find frida's .pyd, run:
#   python -c "import frida; print(frida.__file__)"
# and add the directory that contains _frida.pyd to binaries manually.

import sys
from PyInstaller.utils.hooks import collect_dynamic_libs, collect_data_files

# Collect frida's native shared library (.pyd / .so / .dylib)
frida_binaries = collect_dynamic_libs('frida')
frida_datas    = collect_data_files('frida')

block_cipher = None

a = Analysis(
    ['dump_il2cpp_classes.py'],
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
        # Trim unused stdlib modules to keep the exe smaller
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
        'logging.handlers',
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
    name='IL2CppDumper',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,            # compress with UPX if available; set False if UPX not installed
    upx_exclude=[
        '_frida.pyd',    # don't compress the native extension — UPX can corrupt it
    ],
    runtime_tmpdir=None,
    console=True,        # keep console window; this is a CLI tool
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
