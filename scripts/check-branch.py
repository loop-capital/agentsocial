#!/usr/bin/env python3
"""Block commits directly to main branch. Use feature branches instead."""
import sys
import os

def main():
    # Get current branch
    branch = os.popen('git rev-parse --abbrev-ref HEAD').read().strip()
    
    if branch == 'main':
        print('🚫 DIRECT COMMIT TO MAIN BLOCKED!')
        print()
        print('Create a feature branch instead:')
        print(f'  git checkout -b feat/your-feature-name')
        print(f'  git checkout -b fix/your-fix-name')
        print(f'  git checkout -b chore/your-chore-name')
        print()
        print('To bypass (NOT recommended): git commit --no-verify')
        sys.exit(1)
    
    sys.exit(0)

if __name__ == '__main__':
    main()