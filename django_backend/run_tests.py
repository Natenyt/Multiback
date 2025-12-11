#!/usr/bin/env python
"""
Test runner script for the CivicConnect platform.
Run all tests or specific test suites.
"""
import sys
import subprocess
import os

def run_django_tests(test_path=None, verbose=False, coverage=False):
    """Run Django tests."""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    cmd = ['pytest', 'tests/']
    if test_path:
        cmd.append(test_path)
    if verbose:
        cmd.append('-v')
    if coverage:
        cmd.extend(['--cov=.', '--cov-report=html', '--cov-report=term'])
    
    result = subprocess.run(cmd)
    return result.returncode == 0

def run_fastapi_tests(verbose=False):
    """Run FastAPI tests."""
    fastapi_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fastapi_microservice')
    os.chdir(fastapi_dir)
    
    cmd = ['pytest', 'tests/']
    if verbose:
        cmd.append('-v')
    
    result = subprocess.run(cmd)
    return result.returncode == 0

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Run test suites')
    parser.add_argument('--django', action='store_true', help='Run Django tests')
    parser.add_argument('--fastapi', action='store_true', help='Run FastAPI tests')
    parser.add_argument('--all', action='store_true', help='Run all tests')
    parser.add_argument('--path', type=str, help='Run specific test file or path')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--coverage', '-c', action='store_true', help='Generate coverage report')
    
    args = parser.parse_args()
    
    if args.all or (not args.django and not args.fastapi):
        # Run all by default
        django_ok = run_django_tests(args.path, args.verbose, args.coverage)
        fastapi_ok = run_fastapi_tests(args.verbose)
        sys.exit(0 if (django_ok and fastapi_ok) else 1)
    else:
        success = True
        if args.django:
            success = run_django_tests(args.path, args.verbose, args.coverage) and success
        if args.fastapi:
            success = run_fastapi_tests(args.verbose) and success
        sys.exit(0 if success else 1)




